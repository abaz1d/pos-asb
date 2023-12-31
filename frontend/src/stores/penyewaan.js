import { defineStore } from "pinia";
import { request } from "../utils/api";
import { useAuthStore } from "./auth";

export const usePenyewaanStore = defineStore({
  id: "penyewaan",
  state: () => ({
    rawVarians: [],
    rawAnggotas: [],
    rawPenyewaans: [],
    rawDetails: [],
    rawPrints: [],
    rawLaporans: [],

    rawPenyewaanDetail: [],
  }),
  getters: {
    varians: (state) => state.rawVarians,
    anggotas: (state) => state.rawAnggotas,
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
          this.rawVarians = data.data.varian;
          this.rawAnggotas = data.data.anggota;
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
      periode,
      total_harga_global,
      total_bayar_global,
      kembalian,
      status,
      file_jaminan,
      file_penyerahan,
      file_pengembalian,
      gambar_lama_jaminan,
      gambar_lama_penyerahan,
      gambar_lama_pengembalian,
      tgl_kembali,
      id_pelanggan,
      metode_pembayaran,
      isEdit
    ) {
      const total_harga_sewa = total_harga_global;
      const total_bayar_sewa = total_bayar_global;
      const formData = new FormData();
      formData.append("no_invoice", no_invoice);
      formData.append("periode", periode);
      formData.append("total_harga", total_harga_global);
      formData.append("total_bayar", total_bayar_global);
      formData.append("kembalian", kembalian);
      formData.append("id_pelanggan", id_pelanggan);
      formData.append("metode_pembayaran", metode_pembayaran);
      formData.append("status", status);
      formData.append("file_jaminan", file_jaminan);
      formData.append("file_penyerahan", file_penyerahan);
      formData.append("file_pengembalian", file_pengembalian);
      if (gambar_lama_jaminan != null) {
        formData.append(
          "gambar_lama_jaminan",
          gambar_lama_jaminan.data.map((b) => String.fromCharCode(b)).join("")
        );
      } else {
        formData.append("gambar_lama_jaminan", "");
      }
      if (gambar_lama_penyerahan != null) {
        formData.append(
          "gambar_lama_penyerahan",
          gambar_lama_penyerahan.data
            .map((b) => String.fromCharCode(b))
            .join("")
        );
      } else {
        formData.append("gambar_lama_penyerahan", "");
      }
      if (gambar_lama_pengembalian != null) {
        formData.append(
          "gambar_lama_pengembalian",
          gambar_lama_pengembalian.data
            .map((b) => String.fromCharCode(b))
            .join("")
        );
      } else {
        formData.append("gambar_lama_pengembalian", "");
      }

      if (!isEdit) {
        this.rawPenyewaans.push({
          no_invoice,
          periode,
          total_harga_sewa,
          total_bayar_sewa,
          kembalian,
          id_pelanggan,
          metode_pembayaran,
          status,
        });
      }
      const headers = { "Content-Type": "multipart/form-data" };
      try {
        const { data } = await request.post(
          "penyewaan/upsewa",
          formData,
          headers
        );
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
        .delete(`penyewaan/delete/${no_invoice}`)
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
    async updatePeriode(periode, no_invoice) {
      try {
        const { data } = await request.put(
          `penyewaan/updperiode/${no_invoice}`,
          { periode }
        );

        if (data.success) {
          return data.data[0].total_harga;
        }
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
