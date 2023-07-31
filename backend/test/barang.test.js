const chai = require("chai");
const chaiHttp = require("chai-http");

const app = require("../app");
const Barang = require("../routes/barang");

const expect = chai.expect;
chai.use(chaiHttp);

describe("Barang Routes", function () {
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
});
