import { defineStore } from "pinia";
import { request } from "../utils/api";
import { useAuthStore } from "./auth";

export const usePenyewaanStore = defineStore({
  id: "penyewaan",
  state: () => ({
    rawVarians: [],
    rawPenyewaans: [],
    rawDetails: [],
    rawPrints: [],
    rawLaporans: [],

    rawPenyewaanDetail: [],
  }),
  getters: {
    varians: (state) => state.rawVarians,
    penyewaans: (state) => state.rawPenyewaans,
    details: (state) => state.rawDetails,
    prints: (state) => state.rawPrints,
    laporans: (state) => state.rawLaporans,

    penyewaanDetail: (state) => state.rawPenyewaanDetail,
  },
  actions: {
    async readLaporan() {
      try {
        const Auth = useAuthStore();
        const { data } = await request.get(
          `${
            Auth.items.role !== "Super Admin"
              ? `penyewaan/laporan?id_outlet=${String(Auth.items.id_outlet)}`
              : "penyewaan/laporan"
          }`
        );
        if (data.success) {
          this.rawLaporans = data.data;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async readItem() {
      try {
        const Auth = useAuthStore();
        const { data } = await request.get(
          `${
            Auth.items.role !== "Super Admin"
              ? `penyewaan?id_outlet=${String(Auth.items.id_outlet)}`
              : "penyewaan"
          }`
        );
        if (data.success) {
          console.log("daaatttaaaa", data);
          this.rawVarians = data.data.varian;
          this.rawPenyewaans = data.data.penyewaan;
          this.rawDetails = data.data.details;
          return this.rawPenyewaans;
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async addPenyewaan(
      no_invoice,
      waktu,
      total_harga_global,
      total_bayar_global,
      kembalian,
      isEdit
    ) {
      const tanggal_penyewaan = waktu;
      const total_harga_sewa = total_harga_global;
      const total_bayar_sewa = total_bayar_global;
      if (!isEdit) {
        this.rawPenyewaans.push({
          no_invoice,
          tanggal_penyewaan,
          total_harga_sewa,
          total_bayar_sewa,
          kembalian,
        });
      }
      try {
        const { data } = await request.post("penyewaan/upsewa", {
          no_invoice,
          total_harga_sewa,
          total_bayar_sewa,
          kembalian,
        });
        if (data.success) {
          this.rawPenyewaans = this.rawPenyewaans.map((item) => {
            if (item.no_invoice == no_invoice) {
              return data.data[0];
            }
            return item;
          });
          return this.rawPenyewaans;
        }
      } catch (error) {
        throw new Error(error);
      }
    },

    removePenyewaan(no_invoice) {
      this.rawPenyewaans = this.rawPenyewaans.filter(
        (item) => item.no_invoice !== no_invoice
      );
      request
        .get(`penyewaan/delete/${no_invoice}`)
        .then((res) => {
          if (res.success) {
            return res.success;
          }
        })
        .catch((error) => console.error(error));
    },
    async addDetailPenyewaan(noInvoice, id_varian, qty) {
      const no_invoice = String(noInvoice);
      try {
        const { data } = await request.post("penyewaan/additem", {
          no_invoice,
          id_varian,
          qty,
        });
        if (data.success) {
          this.readDetailPenyewaan(noInvoice);
          return data.data[0];
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async readDetailPenyewaan(no_invoice) {
      try {
        const { data } = await request.get(`/penyewaan/details/${no_invoice}`);
        this.rawPenyewaanDetail = data.data;
        return data.data;
      } catch (error) {
        throw new Error(error);
      }
    },
    async updateDetail(id_detail_sewa, no_invoice, qty) {
      try {
        const { data } = await request.put(
          `penyewaan/upditem/${id_detail_sewa}`,
          { qty: qty, no_invoice: no_invoice }
        );
        if (data.success) {
          let dataBaru = data.data.detail;
          this.rawPenyewaanDetail = this.rawPenyewaanDetail.map((item) => {
            if (item.id_detail_sewa === dataBaru.id_detail_sewa) {
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
    async removeItem(id_detail_sewa, noInvoice) {
      try {
        const { data } = await request.delete(
          `penyewaan/delitem/${id_detail_sewa}`,
          { data: { no_invoice: noInvoice } }
        );
        if (data.success) {
          this.rawPenyewaanDetail = this.rawPenyewaanDetail.filter(
            (item) => item.id_detail_sewa !== id_detail_sewa
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
    async readDetail(no_invoice) {
      try {
        const { data } = await request.get(`penyewaan?noInvoice=${no_invoice}`);
        if (data.success) {
          this.rawDetails = data.data.details;
          this.rawPrints = data.data.print.rows;

          this.rawDetails.map((detail) => {
            this.rawPenyewaans = this.rawPenyewaans.map((penyewaan) => {
              if (detail.no_invoice === penyewaan.no_invoice) {
                return { ...penyewaan, serviceHistory: this.rawDetails };
              }
              return penyewaan;
            });
            return detail;
          });
          return this.rawPenyewaans;
        }
      } catch (error) {
        throw new Error(error);
      }
    },

    async readDetailItem(id_varian) {
      try {
        const Auth = useAuthStore();
        const { data } = await request.get(
          `/penyewaan/barang/${id_varian}?id_outlet=${String(
            Auth.items.id_outlet
          )}`
        );
        return data.data[0];
      } catch (error) {
        throw new Error(error);
      }
    },

    async startTransaction() {
      try {
        const Auth = useAuthStore();
        const { data } = await request.post(
          `/penyewaan/create?id_outlet=${String(Auth.items.id_outlet)}`
        );
        return data.data[0];
      } catch (error) {
        throw new Error(error);
      }
    },
  },
});
