var express = require("express");
var router = express.Router();
var path = require("path");
const { isLoggedIn, Response } = require("../helpers/util");

module.exports = function (db) {
  router.get("/", isLoggedIn, async function (req, res, next) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM penitipan ORDER BY no_invoice DESC`
      );
      const noInvoice = req.query.noInvoice ? req.query.noInvoice : "";
      const details = await db.query(
        "SELECT dp.*, v.nama_varian FROM penitipan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian WHERE dp.no_invoice = $1 ORDER BY dp.id_detail_titip",
        [noInvoice]
      );
      const barang = await db.query(
        "SELECT * FROM barang ORDER BY CAST(REGEXP_REPLACE(id_barang, '[^0-9]', '', 'g') AS INTEGER) ASC"
      );
      const satuan = await db.query("SELECT * FROM satuan ORDER BY id_satuan");
      const print = await db.query(
        "SELECT dp.*,pe.*,v.nama_varian FROM penitipan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian LEFT JOIN penitipan as pe ON dp.no_invoice = pe.no_invoice WHERE dp.no_invoice = $1",
        [noInvoice]
      );

      res.json(
        new Response({
          penitipan: rows,
          satuan: satuan.rows,
          details: details.rows,
          barang: barang.rows,
          print,
        })
      );
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e.toString(), false));
    }
  });

  router.get("/laporan", async function (req, res, next) {
    try {
      const { rows } = await db.query(
        "SELECT penitipan_detail.*, varian.nama_varian, penitipan.tanggal_penitipan, penitipan.total_harga_titip, penitipan.total_bayar_titip, penitipan.kembalian_titip FROM public.penitipan_detail LEFT JOIN penitipan ON penitipan_detail.no_invoice = penitipan.no_invoice LEFT JOIN varian ON penitipan_detail.id_varian = varian.id_varian ORDER BY penitipan.tanggal_penitipan DESC"
      );
      res.json(new Response(rows, true));
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e.toString(), false));
    }
  });

  router.post("/create", async function (req, res, next) {
    try {
      const { rows } = await db.query(
        "INSERT INTO penitipan(total_harga, id_outlet) VALUES(0, $1) returning *",
        [req.body.id_outlet]
      );
      res.json(new Response(rows[0], true));
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e.toString(), false));
    }
  });

  router.get("/barang/:id_varian", isLoggedIn, async function (req, res, next) {
    try {
      const { rows } = await db.query(
        "SELECT var.*, b.id_barang, b.nama_barang FROM varian as var LEFT JOIN barang as b ON var.id_barang = b.id_barang WHERE id_varian = $1 ORDER BY var.id_barang",
        [req.params.id_varian]
      );
      res.json(new Response(rows[0], true));
    } catch (e) {
      res.status(500).json(new Response(e.toString(), false));
    }
  });
  router.post("/additem", async function (req, res, next) {
    try {
      let barang = await db.query(
        "INSERT INTO varian(nama_varian, id_barang, stok_global, harga_beli_varian, id_satuan, id_gudang, kategori, harga_jual_varian) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_varian",
        [
          req.body.nama_varian,
          req.body.id_barang,
          req.body.stok,
          req.body.harga_titip,
          req.body.satuan,
          "GD-0011",
          false,
          req.body.harga_jual,
        ]
      );
      subvarian = await db.query(
        "INSERT INTO sub_varian(id_varian, id_outlet, stok_varian) VALUES ($1, $2, $3)",
        [barang.rows[0].id_varian, req.body.id_outlet, req.body.stok]
      );
      detail = await db.query(
        "INSERT INTO penitipan_detail(no_invoice, id_varian, qty)VALUES ($1, $2, $3) returning *",
        [req.body.no_invoice, barang.rows[0].id_varian, req.body.stok]
      );
      const { rows } = await db.query(
        "SELECT * FROM penitipan WHERE no_invoice = $1",
        [req.body.no_invoice]
      );
      res.json(new Response(rows[0], true));
    } catch (e) {
      res.status(500).json(new Response(e.toString(), false));
    }
  });
  router.post("/uptitip", async function (req, res, next) {
    try {
      udatetitip = await db.query(
        "UPDATE penitipan SET tanggal_diambil = $1 WHERE no_invoice = $2",
        [req.body.tanggal_diambil, req.body.no_invoice]
      );
      const { rows } = await db.query(
        "SELECT * FROM penitipan WHERE no_invoice = $1",
        [req.body.no_invoice]
      );
      res.json(new Response(rows, true));
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e.toString(), false));
    }
  });
  router.get(
    "/details/:no_invoice",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const { rows } = await db.query(
          "SELECT dp.*, v.nama_varian FROM penitipan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian WHERE dp.no_invoice = $1 ORDER BY dp.id_detail_titip",
          [req.params.no_invoice]
        );
        res.json(new Response(rows, true));
      } catch (e) {
        res.status(500).json(new Response(e.toString(), false));
      }
    }
  );

  router.delete(
    "/delete/:no_invoice",
    isLoggedIn,
    async function (req, res, next) {
      try {
        delPen = await db.query(
          "DELETE FROM penitipan_detail WHERE no_invoice = $1",
          [req.params.no_invoice]
        );
        const { rows } = await db.query(
          "DELETE FROM penitipan WHERE no_invoice = $1",
          [req.params.no_invoice]
        );
        res.json(new Response({ message: "delete barang success" }, true));
      } catch (e) {
        console.log(e);
        res.status(500).json(new Response(e.toString(), false));
      }
    }
  );
  router.put(
    "/upditem/:id_detail_titip",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const qty = parseInt(req.body.qty);
        const id = parseInt(req.params.id_detail_titip);
        //console.log("updte itm", id,qty, req.body);
        const detail = await db.query(
          "WITH updated AS (UPDATE penitipan_detail SET qty = $1 WHERE id_detail_titip = $2 RETURNING *) SELECT updated.*, v.nama_varian FROM updated LEFT JOIN varian v ON updated.id_varian = v.id_varian",
          [qty, id]
        );
        const { rows } = await db.query(
          "SELECT * FROM penitipan WHERE no_invoice = $1",
          [req.body.no_invoice]
        );
        //console.log("updte itm", rows, detail.rows[0]);
        res.json(new Response({ rows, detail: detail.rows[0] }, true));
      } catch (e) {
        console.log(e);
        res.status(500).json(new Response(e.toString(), false));
      }
    }
  );

  router.put(
    "/updperiode/:no_invoice",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const tanggal_diambil = req.body.tanggal_diambil;
        const id = req.params.no_invoice;
        const { rows } = await db.query(
          "UPDATE penitipan SET tanggal_diambil = $1 WHERE no_invoice = $2 RETURNING *",
          [tanggal_diambil, id]
        );
        res.json(new Response(rows));
      } catch (e) {
        console.error(e);
        res.status(500).json(new Response(e, false));
      }
    }
  );

  router.delete(
    "/delitem/:id_detail_titip",
    isLoggedIn,
    async function (req, res, next) {
      try {
        let detail = await db.query(
          "SELECT id_varian FROM penitipan_detail WHERE id_detail_titip = $1 returning *",
          [req.params.id_detail_titip]
        );
        varian = await db.query("DELETE FROM varian WHERE id_varian = $1", [
          detail.rows[0].id_varian,
        ]);
        let delDetail = await db.query(
          "DELETE FROM penitipan_detail WHERE id_detail_titip = $1 returning *",
          [req.params.id_detail_titip]
        );
        const { rows } = await db.query(
          "SELECT SUM(total_harga_detail_titip)  AS total FROM penitipan_detail WHERE no_invoice = $1",
          [req.body.no_invoice]
        );
        res.json(new Response(rows, true));
      } catch (e) {
        console.error(e);
        res.status(500).json(new Response(e.toString(), false));
      }
    }
  );

  return router;
};
