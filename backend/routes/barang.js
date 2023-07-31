var express = require("express");
var router = express.Router();
const fs = require("fs");
var path = require("path");
const XLSX = require("xlsx");
const { isLoggedIn, Response } = require("../helpers/util");

module.exports = function (db) {
  router.get("/", isLoggedIn, async function (req, res) {
    try {
      let sql = "SELECT * FROM barang";
      sql += ` ORDER BY id_barang ASC`;
      db.query(sql, (err, barang) => {
        if (err) throw new Error(err);
        const id_barang = req.query.id_barang ? req.query.id_barang : "";
        const id_outlet = req.query.id_outlet ? req.query.id_outlet : "";
        let reqSQL;
        let argumentSQL;
        if (id_outlet == "") {
          reqSQL =
            "SELECT  v.kategori, v.gambar_varian, b.id_barang, b.nama_barang, v.id_varian, v.nama_varian, v.stok_global, s.nama_satuan, v.harga_beli_varian, v.harga_jual_varian FROM varian as v LEFT JOIN barang as b ON v.id_barang = b.id_barang LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan WHERE v.id_barang = $1;";
          argumentSQL = [id_barang];
        } else {
          reqSQL =
            "SELECT sv.id_sub_varian, v.kategori, v.gambar_varian, b.id_barang, b.nama_barang, v.id_varian, v.nama_varian, sv.stok_varian, s.nama_satuan, o.nama_outlet, v.harga_beli_varian, v.harga_jual_varian FROM sub_varian AS sv LEFT JOIN varian AS v ON sv.id_varian = v.id_varian LEFT JOIN barang AS b ON v.id_barang = b.id_barang LEFT JOIN outlet AS o ON sv.id_outlet = o.id_outlet LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan WHERE b.id_barang = $1 AND o.id_outlet = $2";
          argumentSQL = [id_barang, id_outlet];
        }
        db.query(reqSQL, argumentSQL, (err, varian) => {
          if (err) throw new Error(err);
          res.json(
            new Response({
              varian: varian.rows,
              barang: barang.rows,
            })
          );
        });
      });
    } catch (error) {
      res.status(500).json(new Response(error, false));
    }
  });

  router.get("/laporan", async function (req, res, next) {
    try {
      const { rows } = await db.query(
        "SELECT v.kategori,, v.gambar_varian, b.nama_barang, v.id_varian, v.nama_varian, stok.stok_global, s.nama_satuan, v.harga_beli_varian, v.harga_jual_varian FROM varian as v LEFT JOIN barang as b ON v.id_barang = b.id_barang LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan LEFT JOIN (SELECT id_varian, sum(stok_varian) AS stok_global FROM sub_varian GROUP  BY 1) stok ON v.id_varian = stok.id_varian"
      );
      res.json(new Response({ rows }));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.get("/addvarian", isLoggedIn, async function (req, res) {
    try {
      db.query("SELECT * FROM barang", (err, rowsB) => {
        if (err) throw new Error(err);
        db.query("SELECT * FROM satuan", (err, rowsS) => {
          if (err) throw new Error(err);
          db.query("SELECT * FROM gudang", (err, rowsG) => {
            if (err) throw new Error(err);
            const barang = rowsB.rows;
            const satuan = rowsS.rows;
            const gudang = rowsG.rows;
            res.json(new Response({ barang, satuan, gudang }));
          });
        });
      });
    } catch (error) {
      res.status(500).json(new Response(error, false));
    }
  });

  router.post("/addvarian", async function (req, res, next) {
    try {
      let gambar;
      let uploadPath;
      if (!req.files || Object.keys(req.files).length === 0) {
        console.log("No files to upload");
        db.query(
          `WITH inserted AS (INSERT INTO varian(nama_varian, id_barang,
            stok_global, harga_beli_varian, id_satuan,
             id_gudang, kategori, harga_jual_varian) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *) SELECT * FROM inserted LEFT JOIN barang ON inserted.id_barang = barang.id_barang`,
          [
            req.body.nama_varian,
            req.body.kategori_barang,
            req.body.stok_varian,
            req.body.harga_beli,
            req.body.satuan_varian,
            req.body.gudang,
            req.body.kategori === "S" ? true : false,
            req.body.harga_jual,
          ]
        )
          .then((rows) => {
            let data = rows.rows[0];
            res.json(new Response({ data }));
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        // The name of the input field (i.e. "gambar") is used to retrieve the uploaded file
        gambar = req.files.file;
        const filename = `A${Date.now()}-${gambar.name}`;
        uploadPath = path.join(__dirname, "..", "public", "gambar", filename);
        // Use the mv() method to place the file somewhere on your server
        gambar.mv(uploadPath, function (err) {
          if (err) throw new Error(err);
          if (Object.keys(req.body).length < 10) {
            console.log("8 body");
            db.query(
              `WITH inserted AS (INSERT INTO varian(nama_varian, id_barang,
            stok_global, harga_beli_varian, id_satuan,
             id_gudang, kategori, gambar_varian, harga_jual_varian) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *) SELECT * FROM inserted LEFT JOIN barang ON inserted.id_barang = barang.id_barang`,
              [
                req.body.nama_varian,
                req.body.kategori_barang,
                req.body.stok_varian,
                req.body.harga_beli,
                req.body.satuan_varian,
                req.body.gudang,
                req.body.kategori === "S" ? true : false,
                filename,
                req.body.harga_jual,
              ]
            )
              .then((rows) => {
                let data = rows.rows[0];
                res.json(new Response({ data }));
              })
              .catch((err) => {
                throw new Error(err);
              });
          } else {
            console.log("7 lebih");
            db.query(
              `WITH inserted AS (INSERT INTO varian(id_varian ,nama_varian, id_barang,
            stok_global, harga_beli_varian, id_satuan,
             id_gudang, kategori, gambar_varian, harga_jual_varian) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *) SELECT * FROM inserted LEFT JOIN barang ON inserted.id_barang = barang.id_barang`,
              [
                req.body.id_varian,
                req.body.nama_varian,
                req.body.kategori_barang,
                req.body.stok_varian,
                req.body.harga_beli,
                req.body.satuan_varian,
                req.body.gudang,
                req.body.kategori === "S" ? true : false,
                filename,
                req.body.harga_jual,
              ]
            )
              .then((rows) => {
                let data = rows.rows[0];
                res.json(new Response({ data }));
              })
              .catch((err) => {
                throw new Error(err);
              });
          }
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(new Response(error, false));
    }
  });

  router.post("/addmultivarian", async function (req, res, next) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .json(new Response({ message: "No files were uploaded." }, false));
      } else {
        const file = req.files.file; // Mengakses file dari permintaan

        const workbook = XLSX.read(file.data, { type: "buffer" }); // Membaca file menggunakan buffer data
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data[0][0] === "Nama Varian") {
          var response = []; // Pindahkan variabel response di luar loop

          for (let i = 1; i < data.length; i++) {
            if (data[i].length === 8) {
              const nama_varian = data[i][0];
              const id_barang = data[i][1];
              const harga_beli_varian = data[i][2];
              const id_satuan = data[i][3];
              const id_gudang = data[i][4];
              const harga_jual_varian = data[i][5];
              const stok_global = data[i][6];
              const kategori = data[i][7] === "S" ? true : false;
              const query = `INSERT INTO varian(nama_varian, id_barang, harga_beli_varian, id_satuan, id_gudang, harga_jual_varian, stok_global, kategori)  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

              // Tambahkan await di depan db.query() untuk menunggu query selesai
              await db
                .query(query, [
                  nama_varian,
                  id_barang,
                  harga_beli_varian,
                  id_satuan,
                  id_gudang,
                  harga_jual_varian,
                  stok_global,
                  kategori,
                ])
                .then((rows) => {
                  response = response.concat(rows.rows);
                })
                .catch((err) => {
                  throw new Error(err);
                });
            }
          }

          res.json(new Response({ message: "add multi varian success" }, true)); // Pindahkan console.log() ke luar loop
        } else if (data[0][0] === "Nama Barang") {
          var response = [];

          for (let i = 1; i < data.length; i++) {
            if (data[i].length === 1) {
              const nama_barang = data[i][0];
              const query = `INSERT INTO barang(nama_barang) VALUES ($1) RETURNING *`;

              try {
                const rows = await db.query(query, [nama_barang]);
                response = response.concat(rows.rows);
              } catch (err) {
                throw new Error(err);
              }
            }
          }
          res.json(new Response(response));
        } else {
          return res
            .status(400)
            .json(
              new Response(
                { message: "File yang anda kirim tidak valid" },
                false
              )
            );
        }
      }
    } catch (error) {
      console.error("add_multi", error);
      res.status(500).json(new Response(error, false));
    }
  });

  router.get("/editvar/:id", isLoggedIn, async (req, res) => {
    try {
      db.query("SELECT * FROM barang", (err, rowsB) => {
        if (err) console.error(err);
        db.query("SELECT * FROM satuan", (err, rowsS) => {
          if (err) console.error(err);
          db.query("SELECT * FROM gudang", (err, rowsG) => {
            if (err) console.error(err);
            const barang = rowsB.rows;
            const satuan = rowsS.rows;
            const gudang = rowsG.rows;
            db.query(
              `SELECT var.id_varian,
          var.nama_varian,
            bar.id_barang,
          bar.nama_barang,
          stok.stok_terpakai,
          var.stok_global,
            var.harga_beli_varian,
            var.harga_jual_varian,
            sat.id_satuan,
            sat.nama_satuan,
            gud.id_gudang,
            gud.nama_gudang,
            var.kategori,
            var.gambar_varian
      FROM varian var
      INNER JOIN barang bar ON bar.id_barang = var.id_barang
      INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
      INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang LEFT JOIN (SELECT id_varian, sum(stok_varian) AS stok_terpakai FROM sub_varian GROUP  BY 1) stok ON var.id_varian = stok.id_varian WHERE var.id_varian = $1`,
              [req.params.id],
              (err, rows) => {
                if (err) throw new Error(err);
                let item = rows.rows[0];
                res.json(new Response({ item, barang, satuan, gudang }));
              }
            );
          });
        });
      });
    } catch (error) {
      res.status(500).json(new Response(error, false));
    }
  });

  router.post("/editvar/:id", async function (req, res) {
    try {
      const { gambar_lama } = req.body;
      let gambar;
      let uploadPath;

      if (!req.files || Object.keys(req.files).length === 0) {
        db.query(
          `UPDATE varian SET nama_varian = $1, id_barang = $2, stok_global = $3, harga_beli_varian = $4, id_satuan = $5, id_gudang = $6, kategori = $7, gambar_varian = $8, harga_jual_varian = $9 WHERE id_varian = $10 RETURNING * `,
          [
            req.body.nama_varian,
            req.body.kategori_barang,
            req.body.stok_varian,
            req.body.harga_beli,
            req.body.satuan_varian,
            req.body.gudang,
            req.body.kategori === "S" ? true : false,
            gambar_lama,
            req.body.harga_jual,
            req.params.id,
          ]
        )
          .then((rows) => {
            let data = rows.rows[0];
            res.json(new Response({ data }));
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        console.log(req.body);
        gambar = req.files.file;
        const filename = `A${Date.now()}-${gambar.name}`;
        uploadPath = path.join(__dirname, "..", "public", "gambar", filename);
        deletePath = path.join(
          __dirname,
          "..",
          "public",
          "gambar",
          req.body.gambar_lama
        );
        if (req.body.gambar_lama != "" && fs.existsSync(deletePath)) {
          fs.unlink(deletePath, (err) => {
            if (err) throw new Error(err);
            gambar.mv(uploadPath, function (err) {
              if (err) throw new Error(err);

              db.query(
                `UPDATE varian SET nama_varian = $1, id_barang = $2, stok_global = $3, harga_beli_varian = $4, id_satuan = $5, id_gudang = $6, gambar_varian = $7, harga_jual_varian = $8 WHERE id_varian = $9 RETURNING *`,
                [
                  req.body.nama_varian,
                  req.body.kategori_barang,
                  req.body.stok_varian,
                  req.body.harga_beli,
                  req.body.satuan_varian,
                  req.body.gudang,
                  filename,
                  req.body.harga_jual,
                  req.params.id,
                ],
                (err, rows) => {
                  if (err) throw new Error(err);
                  let data = rows.rows[0];
                  res.json(new Response({ data }));
                }
              );
            });
          });
        } else {
          gambar.mv(uploadPath, function (err) {
            if (err) throw new Error(err);
            console.log("file upload", filename);
            db.query(
              `UPDATE varian SET nama_varian = $1, id_barang = $2, stok_global = $3, harga_beli_varian = $4, id_satuan = $5, id_gudang = $6, gambar_varian = $7, harga_jual_varian = $8 WHERE id_varian = $9 RETURNING *`,
              [
                req.body.nama_varian,
                req.body.kategori_barang,
                req.body.stok_varian,
                req.body.harga_beli,
                req.body.satuan_varian,
                req.body.gudang,
                filename,
                req.body.harga_jual,
                req.params.id,
              ],
              (err, rows) => {
                if (err) throw new Error(err);
                let data = rows.rows[0];
                res.json(new Response({ data }));
              }
            );
          });
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json(new Response(error, false));
    }
  });

  router.delete("/deletevar/:id", isLoggedIn, async function (req, res, next) {
    try {
      const { gambar_lama } = req.body;
      const { data } = await db.query(
        "DELETE FROM sub_varian WHERE id_varian = $1",
        [req.params.id]
      );
      const { rows } = await db.query(
        "DELETE FROM varian WHERE id_varian = $1",
        [req.params.id]
      );
      if (gambar_lama !== null) {
        deletePath = path.join(
          __dirname,
          "..",
          "public",
          "gambar",
          gambar_lama
        );
        if (fs.existsSync(deletePath)) {
          fs.unlink(deletePath, (err) => {
            if (err) throw new Error(err);
            res.json(new Response({ message: "delete varian success" }, true));
          });
        }
      } else {
        res.json(new Response({ message: "delete varian success" }, true));
      }
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e, false));
    }
  });
  //----------------------------------------------------------------

  router.get("/addsubvarian", isLoggedIn, async function (req, res) {
    try {
      db.query(
        `SELECT * FROM (
        SELECT var.id_varian, var.nama_varian, svar.id_outlet FROM varian var LEFT JOIN sub_varian svar ON var.id_varian = svar.id_varian) as X
      WHERE (select count(*) FROM (
        SELECT v.id_varian, v.kategori, v.nama_varian, sv.id_outlet FROM varian v LEFT JOIN sub_varian sv ON v.id_varian = sv.id_varian) as Y
         WHERE X.id_varian = Y.id_varian) = 1`,
        (err, rowsV) => {
          if (err) throw new Error(err);
          const varian = rowsV.rows;
          res.json(new Response({ varian }));
        }
      );
    } catch (error) {
      res.status(500).json(new Response(error, false));
    }
  });

  router.post("/addsubvarian", async function (req, res, next) {
    const { id_varian, id_outlet, stok_varian } = req.body;

    try {
      const { rows } = await db.query(
        `WITH insert AS (INSERT INTO sub_varian(id_varian, id_outlet, stok_varian) VALUES ($1, $2, $3) RETURNING *) SELECT sv.id_sub_varian, 
      v.gambar_varian, 
      b.nama_barang, 
      v.id_varian, 
      v.nama_varian, 
      sv.stok_varian,
      s.nama_satuan, 
      o.nama_outlet, 
      v.harga_beli_varian, 
      v.harga_jual_varian 
    FROM insert AS sv  
    LEFT JOIN varian AS v ON sv.id_varian = v.id_varian 
    LEFT JOIN barang AS b ON v.id_barang = b.id_barang 
    LEFT JOIN outlet AS o ON sv.id_outlet = o.id_outlet 
    LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan`,
        [id_varian, id_outlet, stok_varian]
      );
      let data = rows[0];
      res.json(new Response({ data }));
    } catch (error) {
      res.status(500).json(new Response(error, false));
    }
  });

  router.get("/editsubvar/:id", isLoggedIn, async (req, res) => {
    const id_outlet = req.query.id_outlet;
    try {
      db.query(
        `SELECT sv.id_sub_varian, 
      v.gambar_varian, 
      b.id_barang, 
      b.nama_barang, 
      v.id_varian, 
      v.nama_varian, 
      v.kategori,
      v.stok_global,
      st.stok_terpakai,
      (v.stok_global - st.stok_terpakai) AS stok_tersisa,
      sv.stok_varian AS stok_lokal,
      s.id_satuan,
      s.nama_satuan, 
      o.id_outlet,
      o.nama_outlet, 
      v.harga_beli_varian, 
      v.harga_jual_varian 
    FROM varian AS v  
    LEFT JOIN sub_varian AS sv ON v.id_varian = sv.id_varian OR v.id_varian = NULL
    LEFT JOIN barang AS b ON v.id_barang = b.id_barang 
    LEFT JOIN outlet AS o ON sv.id_outlet = o.id_outlet 
    LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan
    LEFT JOIN (SELECT id_varian, sum(stok_varian) AS stok_terpakai FROM sub_varian GROUP  BY 1) st ON sv.id_varian = st.id_varian 
    WHERE v.id_varian = $1`,
        [req.params.id],
        (err, rows) => {
          if (err) throw new Error(err);
          let data = rows.rows;
          if (data.length > 1) {
            data = data.filter((data) => {
              return data.id_outlet === id_outlet;
            });
          }
          res.json(new Response({ item: data[0] }));
        }
      );
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.post("/editsubvar/:id", async function (req, res) {
    const { id_sub_varian, id_varian, id_outlet, stok_varian } = req.body;

    try {
      const { rows } = await db.query(
        `WITH updated AS (UPDATE sub_varian SET id_varian = $1, id_outlet = $2, stok_varian = $3 WHERE id_sub_varian = $4 RETURNING *) SELECT sv.id_sub_varian, 
      v.gambar_varian, 
      b.id_barang, 
      b.nama_barang, 
      v.id_varian, 
      v.nama_varian, 
      v.stok_global,
      st.stok_terpakai,
      (v.stok_global - st.stok_terpakai) AS stok_tersisa,
      sv.stok_varian AS stok_lokal,
      s.id_satuan,
      s.nama_satuan, 
      o.nama_outlet, 
      v.harga_beli_varian, 
      v.harga_jual_varian 
    FROM updated AS sv  
    LEFT JOIN varian AS v ON sv.id_varian = v.id_varian 
    LEFT JOIN barang AS b ON v.id_barang = b.id_barang 
    LEFT JOIN outlet AS o ON sv.id_outlet = o.id_outlet 
    LEFT JOIN satuan AS s ON v.id_satuan = s.id_satuan
    LEFT JOIN (SELECT id_varian, sum(stok_varian) AS stok_terpakai FROM sub_varian GROUP  BY 1) st ON sv.id_varian = st.id_varian`,
        [id_varian, id_outlet, stok_varian, req.params.id]
      );
      let data = rows[0];
      res.json(new Response({ data }));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.delete(
    "/deletesubvar/:id",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const { rows } = await db.query(
          "DELETE FROM sub_varian WHERE id_sub_varian = $1",
          [req.params.id]
        );
        res.json(new Response({ message: "delete sub varian success" }, true));
      } catch (e) {
        res.status(500).json(new Response(e, false));
      }
    }
  );
  //----------------------------------------------------------------
  router.get("/addbarang", isLoggedIn, function (req, res) {
    res.render("barang/addbarang", {
      currentDir: "settingdata",
      current: "barang",
    });
  });

  router.post("/addbarang", async function (req, res, next) {
    try {
      const { rows } = await db.query(
        `INSERT INTO barang(nama_barang) 
      VALUES ($1) RETURNING *`,
        [req.body.nama_barang]
      );
      let data = rows[0];
      res.json(new Response(data));
    } catch (error) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.get("/editbar/:id", isLoggedIn, (req, res) => {
    db.query(
      "SELECT * FROM barang WHERE id_barang = $1",
      [req.params.id],
      (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
        res.render("barang/editbarang", { item: rows.rows[0] });
      }
    );
  });

  router.put("/editbar/:id", async function (req, res) {
    try {
      const { rows } = await db.query(
        `UPDATE barang set
      nama_barang = $1
      WHERE id_barang = $2 RETURNING *`,
        [req.body.nama_barang, req.params.id]
      );
      let data = rows[0];
      res.json(new Response(data));
    } catch (error) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.delete("/deletebar/:id", isLoggedIn, async function (req, res, next) {
    try {
      const { rows } = await db.query(
        "DELETE FROM barang WHERE id_barang = $1 RETURNING *",
        [req.params.id]
      );
      res.json(new Response({ message: "delete barang success" }, true));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });

  return router;
};
