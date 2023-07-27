<template>
  <div class="intro-y box mt-2 p-2">
    <label for="pos-form-1" class="form-label px-2 -mb-2">Periode</label>
    <div class="box flex px-1 items-center mb-3">
      <input
        ref="startDateInput"
        id="startDateInput"
        type="date"
        v-model="startDate"
        class="form-control mr-1 px-1"
        placeholder="Mulai"
      />s.d.
      <input
        ref="endDateInput"
        id="endDateInput"
        type="date"
        v-model="endDate"
        class="form-control ml-1 px-1"
        placeholder="Selesai"
      />
    </div>
    <label for="pos-form-1" class="form-label px-2 -mb-2"
      >Tgl Pengembalian</label
    >
    <div class="box px-1 flex mb-2 items-center">
      <input
        ref="tgKembaliInput"
        id="tgKembaliInput"
        type="date"
        v-model="tgl_kembali"
        class="form-control mr-1 px-1"
        placeholder="MuKembalilai"
      />
    </div>
    <div
      class="box flex p-2 items-center justify-center mx-1 bg-slate-200 rounded-md"
    >
      <p class="text-center text-black">
        {{
          (periode ? periode[0] : "") === ""
            ? "-"
            : (periode ? periode[1] : "") === ""
            ? "-"
            : moment(periode[1]).diff(periode[0], "days") + " Hari"
        }}
        {{
          moment(tgl_kembali).diff(periode ? periode[1] : "", "days") > 0
            ? ", Terlambat " +
              moment(tgl_kembali).diff(periode ? periode[1] : "", "days") +
              " Hari"
            : ""
        }}
      </p>
    </div>
    <div class="box p-2 mt-2">
      <div class="flex">
        <div class="mr-auto font-medium text-base">Total Harga</div>
      </div>
      <div class="bg-slate-200 rounded-md p-2">
        <div class="font-medium text-xl">
          <p class="text-right text-black">
            {{ currencyFormatter.format(totalHargaGlobal) }}
          </p>
        </div>
      </div>

      <div
        class="flex mt-4 pt-4 border-t border-slate-200/60 dark:border-darkmode-400"
      >
        <div class="mr-auto font-medium text-base">Total Bayar</div>
      </div>
      <div
        class="input-group bg-slate-200 rounded-md border-2 border-slate-200/60 mr-0"
      >
        <div class="input-group-text my-auto text-xl">
          <p class="text-black">Rp.</p>
        </div>
        <input
          v-model="totalBayarGlobal"
          type="number"
          class="form-control flex-1 font-medium text-xl text-right"
          placeholder="Nominal Uang"
          required
          @input="updateTotalBayar"
        />
      </div>

      <div class="flex mt-1 pt-4">
        <div class="mr-auto font-medium text-base">Kembalian</div>
      </div>
      <div class="bg-slate-200 rounded-md p-2">
        <div class="font-medium text-xl">
          <p class="text-right text-black">
            {{ currencyFormatter.format(kembalian) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, getCurrentInstance } from "vue";
import { currencyFormatter } from "@/utils/helper";
import moment from "moment";

export default {
  emits: [
    "update:tgl_kembali",
    "update:startDate",
    "update:endDate",
    "update:totalBayarGlobal",
    "update:kembalian",
  ],
  props: {
    tgl_kembali: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    periode: {
      type: Array,
      required: true,
    },
    totalHargaGlobal: {
      type: Number,
      required: true,
    },
    totalBayarGlobal: {
      type: Number,
      required: true,
    },
    kembalian: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      today: moment(),
      jatuhTempo: moment(),
    };
  },
  setup(props) {
    const tgl_kembali = ref(props.tgl_kembali);
    const startDate = ref(props.startDate);
    const endDate = ref(props.endDate);
    const periode = ref(props.periode);
    const totalBayarGlobal = ref(props.totalBayarGlobal);
    const totalHargaGlobal = ref(props.totalHargaGlobal);
    const { emit } = getCurrentInstance();

    function updateTotalBayar(event) {
      totalBayarGlobal.value = event.target.value;
      emit("update:totalBayarGlobal", event.target.value);
    }

    watch(
      () => tgl_kembali.value,
      (newTgl) => {
        emit("update:tgl_kembali", newTgl);
      }
    );
    watch(
      () => startDate.value,
      (newStartDate) => {
        emit("update:startDate", newStartDate);
      }
    );
    watch(
      () => endDate.value,
      (newEndDate) => {
        emit("update:endDate", newEndDate);
      }
    );
    watch(
      () => props.tgl_kembali,
      (newTgl) => {
        tgl_kembali.value = newTgl;
      }
    );
    watch(
      () => props.startDate,
      (newStartDate) => {
        startDate.value = newStartDate;
      }
    );

    watch(
      () => props.endDate,
      (newEndDate) => {
        endDate.value = newEndDate;
      }
    );
    watch(
      () => props.periode,
      (newperiode) => {
        periode.value = newperiode;
      }
    );
    watch(
      () => props.totalBayarGlobal,
      (newbayar) => {
        totalBayarGlobal.value = newbayar;
      }
    );
    watch(
      () => props.totalHargaGlobal,
      (newharga) => {
        // if (
        //   props.periode.length == 2 &&
        //   moment().diff(props.periode[1], "days") > 0
        // ) {
        //   let denda = newharga * 0.05 * moment().diff(props.periode[1], "days");
        //   totalHargaGlobal.value = newharga + denda;
        //   emit("update:kembalian", totalBayarGlobal.value - newharga - denda);
        // } else {
        totalHargaGlobal.value = newharga;
        // }
      }
    );

    return {
      tgl_kembali,
      startDate,
      moment,
      endDate,
      totalBayarGlobal,
      totalHargaGlobal,
      currencyFormatter,
      updateTotalBayar,
    };
  },
};
</script>
