import { defineStore } from "pinia";
import { request } from "../utils/api";
import { useAuthStore } from "./auth";

export const usePenitipanStore = defineStore({
  id: "penitipan",
  state: () => ({
    rawBarangs: [],
    rawSatuans: [],
    rawPenitipans: [],
    rawDetails: [],
    rawPrints: [],
    rawLaporans: [],
    rawPenitipanDetail: [],
  }),
  getters: {
    barangs: (state) => state.rawBarangs,
    satuans: (state) => state.rawSatuans,
    penitipans: (state) => state.rawPenitipans,
    details: (state) => state.rawDetails,
    prints: (state) => state.rawPrints,
    laporans: (state) => state.rawLaporans,

    penitipanDetail: (state) => state.rawPenitipanDetail,
  },
  actions: {
    async readLaporan() {
      try {
        const { data } = await request.get("penitipan/laporan");
        if (data.success) {
          this.rawLaporans = data.data;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async readItem() {
      try {
        const { data } = await request.get("penitipan");
        if (data.success) {
          this.rawBarangs = data.data.barang;
          this.rawSatuans = data.data.satuan;
          this.rawPenitipans = data.data.penitipan;
          this.rawDetails = data.data.details;
          return this.rawPenitipans;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async updatePeriode(tanggal_diambil, no_invoice) {
      try {
        const { data } = await request.put(
          `penitipan/updperiode/${no_invoice}`,
          { tanggal_diambil }
        );
        if (data.success) {
          this.readDetailPenitipan(no_invoice);
          this.rawPenitipans = this.rawPenitipans.map((item) => {
            if (item.no_invoice == no_invoice) {
              return data.data[0];
            }
            return item;
          });
          return data.data[0];
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async addPenitipan(
      no_invoice,
      tanggal_penitipan,
      tanggal_diambil,
      status,
      total_harga,
      isEdit
    ) {
      if (!isEdit) {
        this.rawPenitipans.push({
          no_invoice,
          tanggal_penitipan,
          tanggal_diambil,
          status,
          total_harga,
        });
      }
      try {
        if (tanggal_diambil !== "") {
          const { data } = await request.post("penitipan/uptitip", {
            no_invoice,
            tanggal_diambil,
          });
          if (data.success) {
            this.rawPenitipans = this.rawPenitipans.map((item) => {
              if (item.no_invoice == no_invoice) {
                return data.data[0];
              }
              return item;
            });
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    },

    removePenitipan(no_invoice) {
      this.rawPenitipans = this.rawPenitipans.filter(
        (item) => item.no_invoice !== no_invoice
      );
      request
        .delete(`penitipan/delete/${no_invoice}`)
        .then((res) => {
          if (res.success) {
            return res.success;
          }
        })
        .catch((error) => console.error(error));
    },
    async addDetailPenitipan(
      no_invoice,
      id_barang,
      nama_varian,
      harga_titip,
      harga_jual,
      stok,
      satuan
    ) {
      try {
        const Auth = useAuthStore();
        const { data } = await request.post("penitipan/additem", {
          no_invoice,
          id_barang,
          nama_varian,
          harga_titip,
          harga_jual,
          stok,
          satuan,
          id_outlet: String(Auth.items.id_outlet),
        });
        if (data.success) {
          this.readDetailPenitipan(no_invoice);
          return data.data;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async readDetailPenitipan(no_invoice) {
      try {
        const { data } = await request.get(`/penitipan/details/${no_invoice}`);
        this.rawPenitipanDetail = data.data;
        return data.data;
      } catch (error) {
        throw new Error(error);
      }
    },
    async updateDetail(id_detail_titip, no_invoice, qty) {
      try {
        const { data } = await request.put(
          `penitipan/upditem/${id_detail_titip}`,
          { qty: qty, no_invoice: no_invoice }
        );
        if (data.success) {
          let dataBaru = data.data.detail;
          this.rawPenitipanDetail = this.rawPenitipanDetail.map((item) => {
            if (item.id_detail_titip === dataBaru.id_detail_titip) {
              return dataBaru;
            }
            return item;
          });
          return data.data.rows[0];
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async removeItem(id_detail_titip, noInvoice) {
      try {
        const { data } = await request.delete(
          `penitipan/delitem/${id_detail_titip}`,
          { data: { no_invoice: noInvoice } }
        );
        if (data.success) {
          this.rawPenitipanDetail = this.rawPenitipanDetail.filter(
            (item) => item.id_detail_titip !== id_detail_titip
          );
          if (data.data[0].total !== null) {
            return data.data[0].total;
          } else {
            return 0;
          }
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    updateItem(penitipan) {
      let id_varian = penitipan.id_varian;
      let nama_satuan = penitipan.nama_satuan;
      let keterangan_satuan = penitipan.keterangan_satuan;
      this.rawPenitipans = this.rawPenitipans.map((item) => {
        if (item.id_varian === id_varian) {
          return penitipan;
        }
        return item;
      });
      request
        .post(`penitipan/edit/${id_varian}`, {
          nama_satuan,
          keterangan_satuan,
        })
        .catch((error) => console.error(error));
    },
    async readDetail(no_invoice) {
      try {
        const { data } = await request.get(`penitipan?noInvoice=${no_invoice}`);
        if (data.success) {
          this.rawDetails = data.data.details;
          this.rawPrints = data.data.print.rows;

          this.rawDetails.map((detail) => {
            this.rawPenitipans = this.rawPenitipans.map((penitipan) => {
              if (detail.no_invoice === penitipan.no_invoice) {
                return { ...penitipan, serviceHistory: this.rawDetails };
              }
              return penitipan;
            });
            return detail;
          });
          return this.rawPenitipans;
        }
      } catch (error) {
        throw new Error(error);
      }
    },

    async readDetailItem(id_varian) {
      try {
        const { data } = await request.get(`/penitipan/barang/${id_varian}`);
        if (data.success) {
          return data.data;
        }
      } catch (error) {
        throw new Error(error);
      }
    },

    async startTransaction() {
      try {
        const Auth = useAuthStore();
        const { data } = await request.post("/penitipan/create", {
          id_outlet: String(Auth.items.id_outlet),
        });
        if (data.success) {
          return data.data;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
  },
});
