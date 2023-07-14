var express = require("express");
var router = express.Router();
var path = require("path");
const { isLoggedIn, Response } = require("../helpers/util");

module.exports = function (db) {
  router.get("/", isLoggedIn, async function (req, res, next) {
    try {
      const noInvoice = req.query.noInvoice ? req.query.noInvoice : "";
      const id_outlet = req.query.id_outlet ? req.query.id_outlet : "";
      let reqSQL;
      let argumentSQL;

      if (id_outlet == "") {
        reqSQL = `SELECT * FROM penyewaan ORDER BY no_invoice DESC`;
        argumentSQL = "";
      } else {
        reqSQL = `SELECT * FROM public.penyewaan WHERE id_outlet = $1 ORDER BY no_invoice DESC`;
        argumentSQL = [id_outlet];
      }
      const { rows } = await db.query(reqSQL, argumentSQL);
      const details = await db.query(
        "SELECT dp.*, v.nama_varian FROM penyewaan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian WHERE dp.no_invoice = $1 ORDER BY dp.id_detail_sewa",
        [noInvoice]
      );
      const varian = await db.query(
        "SELECT sv.*,v.nama_varian, b.id_barang, b.nama_barang FROM sub_varian as sv LEFT JOIN varian v ON sv.id_varian = v.id_varian LEFT JOIN barang as b ON v.id_barang = b.id_barang WHERE sv.id_outlet = $1 ORDER BY b.id_barang",
        [id_outlet]
      );
      const print = await db.query(
        "SELECT dp.*,pe.*, v.nama_varian, b.nama_barang FROM penyewaan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian LEFT JOIN barang as b ON b.id_barang = v.id_barang LEFT JOIN penyewaan as pe ON dp.no_invoice = pe.no_invoice WHERE dp.no_invoice = $1",
        [noInvoice]
      );
      res.json(
        new Response({
          penyewaan: rows,
          details: details.rows,
          varian: varian.rows,
          print,
        })
      );
    } catch (e) {
      console.error(e);
      res.status(500).json(new Response(e, false));
    }
  });
  router.get("/laporan", async function (req, res, next) {
    try {
      const id_outlet = req.query.id_outlet ? req.query.id_outlet : "";
      if (id_outlet == "") {
        const { rows } = await db.query(
          "SELECT penyewaan_detail.*, varian.nama_varian, penyewaan.tanggal_penyewaan, penyewaan.total_harga_sewa, penyewaan.total_bayar_sewa, penyewaan.kembalian_sewa, penyewaan.id_outlet FROM public.penyewaan_detail LEFT JOIN penyewaan ON penyewaan_detail.no_invoice = penyewaan.no_invoice LEFT JOIN varian ON penyewaan_detail.id_varian = varian.id_varian ORDER BY penyewaan.tanggal_penyewaan DESC"
        );
        res.json(new Response(rows, true));
      } else {
        const { rows } = await db.query(
          "SELECT penyewaan_detail.*, varian.nama_varian, penyewaan.tanggal_penyewaan, penyewaan.total_harga_sewa, penyewaan.total_bayar_sewa, penyewaan.kembalian_sewa, penyewaan.id_outlet FROM public.penyewaan_detail LEFT JOIN penyewaan ON penyewaan_detail.no_invoice = penyewaan.no_invoice LEFT JOIN varian ON penyewaan_detail.id_varian = varian.id_varian WHERE penyewaan.id_outlet = $1 ORDER BY penyewaan.tanggal_penyewaan DESC",
          [id_outlet]
        );
        res.json(new Response(rows, true));
      }
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });
  router.post("/create", async function (req, res, next) {
    const id_outlet = req.query.id_outlet ? req.query.id_outlet : "";
    try {
      const { rows } = await db.query(
        "INSERT INTO penyewaan(id_outlet) VALUES($1) returning *",
        [id_outlet]
      );
      res.json(new Response(rows, true));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });

  router.get("/barang/:id_varian", isLoggedIn, async function (req, res, next) {
    try {
      const id_outlet = req.query.id_outlet ? req.query.id_outlet : "";
      const { rows } = await db.query(
        "SELECT sv.*,v.nama_varian, b.id_barang, b.nama_barang, v.harga_jual_varian FROM sub_varian sv LEFT JOIN varian v ON sv.id_varian = v.id_varian LEFT JOIN barang b ON v.id_barang = b.id_barang WHERE v.id_varian = $1 AND sv.id_outlet = $2",
        [req.params.id_varian, id_outlet]
      );
      res.json(new Response(rows, true));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });
  router.post("/additem", async function (req, res, next) {
    try {
      detail = await db.query(
        "INSERT INTO penyewaan_detail(no_invoice, id_varian, qty)VALUES ($1, $2, $3) returning *",
        [req.body.no_invoice, req.body.id_varian, req.body.qty]
      );
      const { rows } = await db.query(
        "SELECT * FROM penyewaan WHERE no_invoice = $1",
        [req.body.no_invoice]
      );
      res.json(new Response(rows, true));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });
  router.post("/upsewa", async function (req, res, next) {
    try {
      udatesewa = await db.query(
        "UPDATE penyewaan SET total_harga_sewa = $1, total_bayar_sewa = $2, kembalian_sewa = $3 WHERE no_invoice = $4 returning *",
        [
          req.body.total_harga_sewa,
          req.body.total_bayar_sewa,
          req.body.kembalian,
          req.body.no_invoice,
        ]
      );
      const { rows } = await db.query(
        "SELECT * FROM penyewaan WHERE no_invoice = $1",
        [req.body.no_invoice]
      );
      res.json(new Response(rows, true));
    } catch (e) {
      res.status(500).json(new Response(e, false));
    }
  });
  router.get(
    "/details/:no_invoice",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const { rows } = await db.query(
          "SELECT dp.*, v.nama_varian FROM penyewaan_detail as dp LEFT JOIN varian as v ON dp.id_varian = v.id_varian WHERE dp.no_invoice = $1 ORDER BY dp.id_detail_sewa",
          [req.params.no_invoice]
        );
        res.json(new Response(rows, true));
      } catch (e) {
        res.status(500).json(new Response(e, false));
      }
    }
  );

  router.get(
    "/delete/:no_invoice",
    isLoggedIn,
    async function (req, res, next) {
      try {
        delPen = await db.query(
          "DELETE FROM penyewaan_detail WHERE no_invoice = $1",
          [req.params.no_invoice]
        );
        const { rows } = await db.query(
          "DELETE FROM penyewaan WHERE no_invoice = $1",
          [req.params.no_invoice]
        );
        res.json(new Response({ message: "delete barang success" }, true));
      } catch (e) {
        res.status(500).json(new Response(e, false));
      }
    }
  );
  router.put(
    "/upditem/:id_detail_sewa",
    isLoggedIn,
    async function (req, res, next) {
      try {
        const qty = parseInt(req.body.qty);
        const id = parseInt(req.params.id_detail_sewa);
        const detail = await db.query(
          "WITH updated AS (UPDATE penyewaan_detail SET qty = $1 WHERE id_detail_sewa = $2 RETURNING *) SELECT updated.*, v.nama_varian FROM updated LEFT JOIN varian v ON updated.id_varian = v.id_varian",
          [qty, id]
        );
        const { rows } = await db.query(
          "SELECT * FROM penyewaan WHERE no_invoice = $1",
          [req.body.no_invoice]
        );
        res.json(new Response({ rows, detail: detail.rows[0] }, true));
      } catch (e) {
        console.log(e);
        res.status(500).json(new Response(e, false));
      }
    }
  );

  router.delete(
    "/delitem/:id_detail_sewa",
    isLoggedIn,
    async function (req, res, next) {
      try {
        delDetail = await db.query(
          "DELETE FROM penyewaan_detail WHERE id_detail_sewa = $1",
          [req.params.id_detail_sewa]
        );
        console.log("delDetail", delDetail);
        const { rows } = await db.query(
          "SELECT SUM(total_harga_detail_sewa)  AS total FROM penyewaan_detail WHERE no_invoice = $1",
          [req.body.no_invoice]
        );
        res.json(new Response(rows, true));
      } catch (e) {
        console.error(e);
        res.status(500).json(new Response(e, false));
      }
    }
  );

  return router;
};
