<template>
  <div class="intro-y box">
    <label for="pos-form-1" class="form-label px-2 -mb-2">Periode</label>
    <div class="box flex p-2 items-center">
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
    <div
      class="box flex p-2 items-center justify-center mx-2 bg-slate-200 rounded-md"
    >
      <p class="text-center text-black">
        {{
          periode[0] === ""
            ? "-"
            : periode[1] === ""
            ? "-"
            : moment(periode[1]).diff(periode[0], "days")
        }}
        Hari
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
  emits: ["update:startDate", "update:endDate", "update:totalBayarGlobal"],
  props: {
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
  setup(props) {
    const startDate = ref(props.startDate);
    const endDate = ref(props.endDate);
    const periode = ref(props.periode);
    const totalBayarGlobal = ref(props.totalBayarGlobal);
    const { emit } = getCurrentInstance();

    function updateTotalBayar(event) {
      totalBayarGlobal.value = event.target.value;
      emit("update:totalBayarGlobal", event.target.value);
    }

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

    return {
      startDate,
      moment,
      endDate,
      totalBayarGlobal,
      currencyFormatter,
      updateTotalBayar,
    };
  },
};
</script>
