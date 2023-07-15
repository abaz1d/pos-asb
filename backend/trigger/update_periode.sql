CREATE OR REPLACE FUNCTION update_total_harga_penyewaan() RETURNS TRIGGER AS $set_update_total_harga_penyewaan$
DECLARE
    sum_harga NUMERIC;
    jumlah_hari INTEGER;
    tanggal_kembali DATE;
    selisih_hari INTEGER;
    denda NUMERIC;
BEGIN
    IF (array_length(NEW.periode, 1) = 2) THEN
            SELECT sum(total_harga_detail_sewa) INTO sum_harga FROM penyewaan_detail WHERE no_invoice = NEW.no_invoice;
            jumlah_hari := EXTRACT(DAY FROM AGE(to_date(NEW.periode[2], 'YYYY-MM-DD')::date, to_date(NEW.periode[1], 'YYYY-MM-DD')::date));
            tanggal_kembali := NEW.periode[2];


        sum_harga := sum_harga * jumlah_hari;
          RAISE NOTICE 'Value: %', sum_harga;

        IF (tanggal_kembali < CURRENT_DATE) THEN
            selisih_hari := DATE_PART('day', CURRENT_DATE - tanggal_kembali::timestamp);
            denda := sum_harga * 0.05 * selisih_hari; -- Denda 5% dari total harga per hari keterlambatan
            sum_harga := sum_harga + denda;
        END IF;

            NEW.total_harga := sum_harga;

    END IF;

    RETURN NEW;
END;
$set_update_total_harga_penyewaan$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_update_total_harga_penyewaan
BEFORE INSERT OR UPDATE penyewaan
FOR EACH ROW
EXECUTE FUNCTION update_total_harga_penyewaan();
