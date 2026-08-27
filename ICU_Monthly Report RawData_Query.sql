WITH diagnosis_list AS (
    SELECT
        hp.inhospid,

        STRING_AGG(
            CONCAT(
                hp.seq_no,
                '. ',
                COALESCE(hp.plan_code, ''),
                CASE
                    WHEN hp.plan_code IS NOT NULL
                     AND hp.plan_des IS NOT NULL
                    THEN ' - '
                    ELSE ''
                END,
                COALESCE(hp.plan_des, '')
            ),
            E'\n'
            ORDER BY
                hp.seq_no,
                hp.create_date,
                hp.orderplanid
        ) AS all_diagnoses

    FROM public.hisorderplan hp

    WHERE hp.hplan_type = 'ICD'
      AND hp.dc_status = '0'

    GROUP BY hp.inhospid
)

SELECT
    kc.chr_health_id AS "Health ID",

    inp.inhospid AS "Inpatient ID",

    w.ward_name AS "Ward",

    inp.reservation_date AS "Admitted Date",

    CONCAT_WS(
        ' ',
        NULLIF(TRIM(kc.chr_patient_firstname), ''),
        NULLIF(TRIM(kc.chr_patient_midname), ''),
        NULLIF(TRIM(kc.chr_patient_lastname), '')
    ) AS "Patient Name",

    (CURRENT_DATE - kc.chr_birth_date) / 365 AS "Age",

    CASE
        WHEN kc.chr_sex = 'M' THEN 'Male'
        WHEN kc.chr_sex = 'F' THEN 'Female'
        ELSE kc.chr_sex
    END AS "Sex",

    kc.chr_mobile_phone AS "Mobile Number",

    ref_ward.ward_name AS "Admitted From",

    inp.status AS "Status",

    inp."dischargeType" AS "Discharge Type",

    inp.discharge_date AS "Discharge Date",

    CASE
        -- Completed ICU/HDU stay:
        -- Count both admission day and discharge day
        WHEN LOWER(inp.status) = 'discharged'
             AND inp.discharge_date IS NOT NULL
             AND inp.reservation_date IS NOT NULL
        THEN
            inp.discharge_date::date
            - inp.reservation_date::date
            + 1

        -- Patient still admitted:
        -- Count from admission date through today inclusively
        WHEN LOWER(inp.status) = 'admitted'
             AND inp.reservation_date IS NOT NULL
        THEN
            CURRENT_DATE
            - inp.reservation_date::date
            + 1

        ELSE NULL
    END AS "Duration (Days)",

    dl.all_diagnoses AS "All Diagnoses"

FROM public.inptient_reservation inp

-- Current critical-care ward: ICU / HDU
LEFT JOIN public.wards w
    ON inp.ward_id = w.wardid

-- Patient information
INNER JOIN public.kmu_chart kc
    ON inp.healthid = kc.chr_health_id

-- Ward/location from which the patient was admitted
LEFT JOIN public.wards ref_ward
    ON inp.referral_place = ref_ward.wardid

-- All active ICD diagnoses under the same inpatient hospitalization
LEFT JOIN diagnosis_list dl
    ON inp.inhospid = dl.inhospid

WHERE LOWER(w.ward_name) IN ('icu', 'hdu')

  AND inp.reservation_date >= DATE '2026-08-01'
  AND inp.reservation_date <  DATE '2026-09-01'

ORDER BY
    inp.reservation_date,
    kc.chr_health_id,
    inp.inhospid;