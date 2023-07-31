const chai = require("chai");
const chaiHttp = require("chai-http");
const { pool } = require("../helpers/util");

const app = require("../app");
const Barang = require("../routes/barang");

const expect = chai.expect;
chai.use(chaiHttp);

describe("Barang Routes", function () {
  //sekanrio
  beforeEach(function (done) {
    // const barang = new Barang({
    //   nama_barang: "Example Barang",
    // });
    pool.query(
      `INSERT INTO barang(nama_barang)
      VALUES ($1) RETURNING *`,
      ["Example Barang"],
      (err, rows) => {
        if (err) {
          done(err);
        }
        done();
      }
    );
  });
  afterEach(function (done) {
    pool.query(
      "DELETE FROM barang WHERE nama_barang = $1",
      ["Example Barang"],
      (err, rows) => {
        if (err) {
          done(err);
        }
        done();
      }
    );
  });
  it("seharusnya mendapatkan semua daftar barang dengan metode GET", function (done) {
    chai
      .request(app)
      .get("/barang")
      .end(function (err, res) {
        try {
          expect(err).to.be.null; // Memeriksa apakah error adalah null (tidak ada error)
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("success").to.be.an("boolean");
          expect(res.body).to.have.property("success").to.be.true;
          expect(res.body).to.have.property("data").to.be.an("object");
          expect(res.body.data).to.have.property("varian").to.be.an("array");
          expect(res.body.data).to.have.property("barang").to.be.an("array");
          expect(res.body.data.barang[0])
            .to.have.property("id_barang")
            .to.be.an("string");
          expect(res.body.data.barang[0])
            .to.have.property("nama_barang")
            .to.be.an("string");
          done();
        } catch (err) {
          done(err); // Mengirimkan error ke callback done() untuk menandakan bahwa pengujian gagal
        }
      });
  });
  it("seharusnya menambahkan satu barang dengan metode POST", function (done) {
    chai
      .request(app)
      .post("/barang/addbarang")
      .send({
        nama_barang: "ADD Example Barang",
      })
      .end(function (err, res) {
        expect(err).to.be.null; // Memeriksa apakah error adalah null (tidak ada error)
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an("object");
        expect(res.body).to.have.property("success").to.be.an("boolean");
        expect(res.body).to.have.property("success").to.be.true;
        expect(res.body).to.have.property("data").to.be.an("object");
        expect(res.body.data).to.have.property("id_barang").to.be.an("string");
        expect(res.body.data)
          .to.have.property("nama_barang")
          .to.be.an("string")
          .equal("ADD Example Barang");
        done();
      });
  });
  it("seharusnya memperbarui satu barang melalui path /editbar/:id metode PUT", function (done) {
    chai
      .request(app)
      .get("/barang")
      .end(function (err, res) {
        if (err) done(err);
        else {
          let data = res.body.data.barang.find(
            (item) => item.nama_barang === "ADD Example Barang"
          );

          try {
            chai
              .request(app)
              .put("/barang/editbar/" + data.id_barang)
              .send({
                nama_barang: "Edit Example Barang",
              })
              .end(function (error, response) {
                if (error) done(error);
                expect(error).to.be.null; // Memeriksa apakah error adalah null (tidak ada error)
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                expect(response.body).to.be.an("object");
                expect(response.body)
                  .to.have.property("success")
                  .to.be.an("boolean");
                expect(response.body).to.have.property("success").to.be.true;
                expect(response.body)
                  .to.have.property("data")
                  .to.be.an("object");
                expect(response.body.data)
                  .to.have.property("id_barang")
                  .to.be.an("string");
                expect(response.body.data)
                  .to.have.property("nama_barang")
                  .to.be.an("string")
                  .equal("Edit Example Barang");
                done();
              });
          } catch (err) {
            done(err); // Mengirimkan error ke callback done() untuk menandakan bahwa pengujian gagal
          }
        }
      });
  });
  it("seharusnya menghapus satu barang dengan metode DELETE/deletebar/:id", function (done) {
    chai
      .request(app)
      .get("/barang")
      .end(function (err, res) {
        if (err) done(err);
        else {
          let data = res.body.data.barang.find(
            (item) => item.nama_barang === "Edit Example Barang"
          );
          chai
            .request(app)
            .delete(`/barang/deletebar/${data.id_barang}`)
            .end(function (error, response) {
              if (error) done(error);
              expect(error).to.be.null; // Memeriksa apakah error adalah null (tidak ada error)
              expect(response).to.have.status(200);
              expect(response).to.be.json;
              expect(response.body).to.be.an("object");
              expect(response.body)
                .to.have.property("success")
                .to.be.an("boolean");
              expect(response.body).to.have.property("success").to.be.true;
              expect(response.body).to.have.property("data").to.be.an("object");
              expect(response.body.data)
                .to.have.property("message")
                .to.be.an("string");
              done();
            });
        }
      });
  });
});
