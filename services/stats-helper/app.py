import io
import json
from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)


def infer_dtype(series: pd.Series) -> str:
    """Sütunun mantıksal tipini döndürür: numeric | categorical | datetime"""
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    # Datetime çıkarımı dene
    try:
        pd.to_datetime(series, infer_datetime_format=True)
        return "datetime"
    except Exception:
        return "categorical"


@app.post("/analyze")
def analyze():
    """
    multipart/form-data ile CSV veya Excel dosyası kabul eder.
    Döndürdüğü JSON:
    {
        "columns": [{"name": "...", "dtype": "numeric|categorical|datetime"}],
        "stats": {
            "sütun_adı": {"min": ..., "max": ..., "mean": ..., "std": ...}
            // kategorik için: {"top_values": [{"value": "...", "count": ...}]}
        },
        "sample_rows": [{...}, ...]   // ilk 15 satır
    }
    """
    if "file" not in request.files:
        return jsonify({"error": "Dosya bulunamadı. 'file' alanını gönder."}), 400

    file = request.files["file"]
    filename = file.filename or ""

    try:
        if filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file.read()))
        else:
            # CSV — encoding sorunlarına karşı utf-8-sig de dene
            raw = file.read()
            try:
                df = pd.read_csv(io.BytesIO(raw))
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(raw), encoding="latin-1")
    except Exception as exc:
        return jsonify({"error": f"Dosya okunamadı: {str(exc)}"}), 422

    # --- columns ---
    columns = []
    for col in df.columns:
        columns.append({"name": col, "dtype": infer_dtype(df[col])})

    # --- stats ---
    stats = {}
    for col_info in columns:
        col = col_info["name"]
        dtype = col_info["dtype"]
        series = df[col]

        if dtype == "numeric":
            stats[col] = {
                "min": round(float(series.min()), 6) if not series.empty else None,
                "max": round(float(series.max()), 6) if not series.empty else None,
                "mean": round(float(series.mean()), 6) if not series.empty else None,
                "std": round(float(series.std()), 6) if not series.empty else None,
            }
        else:
            # Kategorik veya datetime: en çok tekrar eden 10 değer
            top = (
                series.value_counts()
                .head(10)
                .reset_index()
                .rename(columns={col: "value", "count": "count"})
            )
            stats[col] = {
                "top_values": top.to_dict(orient="records")
            }

    # --- sample_rows ---
    sample_rows = json.loads(df.head(15).to_json(orient="records", force_ascii=False))

    return jsonify({"columns": columns, "stats": stats, "sample_rows": sample_rows})


if __name__ == "__main__":
    # Geliştirme ortamı için; production'da gunicorn kullan
    app.run(host="0.0.0.0", port=5000, debug=True)
