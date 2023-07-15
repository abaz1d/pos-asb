CREATE OR REPLACE FUNCTION update_penyewaan() RETURNS TRIGGER AS $set_penyewaan$
DECLARE
    outlet VARCHAR;
    status_sewa BOOLEAN;
    stok_lama INTEGER;
    sum_harga NUMERIC;
    jumlah_hari INTEGER;
    tanggal_kembali DATE;
    selisih_hari INTEGER;
    denda NUMERIC;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Update stok hanya ketika status penyewaan adalah false
        SELECT status INTO status_sewa FROM penyewaan WHERE no_invoice = NEW.no_invoice;
        IF NOT status_sewa THEN
            SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
            SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
            UPDATE sub_varian SET stok_varian = stok_lama - NEW.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Update stok hanya ketika status penyewaan sebelumnya adalah false
        SELECT status INTO status_sewa FROM penyewaan WHERE no_invoice = NEW.no_invoice;
        IF NOT status_sewa THEN
            SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
            SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
            UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty - NEW.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        ELSE
            SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = NEW.no_invoice;
            SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
            UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty WHERE id_varian = NEW.id_varian AND id_outlet = outlet;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Update stok hanya ketika status penyewaan adalah false
        SELECT id_outlet INTO outlet FROM penyewaan WHERE no_invoice = OLD.no_invoice;
        SELECT stok_varian INTO stok_lama FROM sub_varian WHERE id_varian = OLD.id_varian AND id_outlet = outlet;
        UPDATE sub_varian SET stok_varian = stok_lama + OLD.qty WHERE id_varian = OLD.id_varian AND id_outlet = outlet;
    END IF;

    -- Menghitung total harga
    IF (TG_OP = 'DELETE') THEN
        SELECT sum(total_harga_detail_sewa) INTO sum_harga FROM penyewaan_detail WHERE no_invoice = OLD.no_invoice;
    ELSE
        SELECT sum(total_harga_detail_sewa) INTO sum_harga FROM penyewaan_detail WHERE no_invoice = NEW.no_invoice;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        IF (SELECT ARRAY_LENGTH(penyewaan.periode, 1) FROM penyewaan WHERE no_invoice = OLD.no_invoice) = 2 THEN
            -- Menghitung selisih hari
            SELECT DATE_PART('day', penyewaan.periode[2]::timestamp - penyewaan.periode[1]::timestamp) INTO jumlah_hari
            FROM penyewaan WHERE no_invoice = OLD.no_invoice;

            -- Mengupdate total harga dengan mengalikan jumlah hari
            sum_harga := sum_harga * jumlah_hari;
            SELECT penyewaan.periode[2] INTO tanggal_kembali FROM penyewaan WHERE no_invoice = OLD.no_invoice;

            IF (tanggal_kembali < CURRENT_DATE) THEN
                selisih_hari := DATE_PART('day', CURRENT_DATE - tanggal_kembali::timestamp);
                denda := sum_harga * 0.05 * selisih_hari; -- Denda 5% dari total harga per hari keterlambatan
                sum_harga := sum_harga + denda;
            END IF;
        END IF;
    ELSE
        IF (SELECT ARRAY_LENGTH(penyewaan.periode, 1) FROM penyewaan WHERE no_invoice = NEW.no_invoice) = 2 THEN
            SELECT DATE_PART('day', penyewaan.periode[2]::timestamp - penyewaan.periode[1]::timestamp) INTO jumlah_hari
            FROM penyewaan WHERE no_invoice = NEW.no_invoice;
            sum_harga := sum_harga * jumlah_hari;
            SELECT penyewaan.periode[2] INTO tanggal_kembali FROM penyewaan WHERE no_invoice = NEW.no_invoice;
     RAISE NOTICE 'Value: %', jumlah_hari;
            IF (tanggal_kembali < CURRENT_DATE) THEN
                selisih_hari := DATE_PART('day', CURRENT_DATE - tanggal_kembali::timestamp);
                denda := sum_harga * 0.05 * selisih_hari; -- Denda 5% dari total harga per hari keterlambatan
                sum_harga := sum_harga + denda;
            END IF;
        END IF;
    END IF;

    -- Update total harga sewa di tabel penyewaan
    IF (TG_OP = 'DELETE') THEN
        UPDATE penyewaan SET total_harga = sum_harga WHERE no_invoice = OLD.no_invoice;
    ELSE
        UPDATE penyewaan SET total_harga = sum_harga WHERE no_invoice = NEW.no_invoice;
    END IF;
 
    RETURN NULL;
END;
$set_penyewaan$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_penyewaan
AFTER INSERT OR UPDATE OR DELETE ON penyewaan_detail
FOR EACH ROW EXECUTE FUNCTION update_penyewaan();
