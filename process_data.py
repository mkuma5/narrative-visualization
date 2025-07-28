import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError as exc:
    sys.exit(
        " pandas is not installed.  Install with:\n"
        "   conda install pandas -c conda-forge    # Anaconda users\n"
        "   pip install --upgrade pandas           # pip users"
    )

RAW_FILE  = Path("data/raw_female_labor_data2.csv")
OUT_FILE  = Path("data/labor_gap_long.csv")
SERIES_ID = "SL.TLF.CACT.FM.ZS"
YEARS     = [str(y) for y in range(2016, 2025)]

def main() -> None:
    if not RAW_FILE.exists():
        sys.exit(f" Input file not found: {RAW_FILE}")

    df = pd.read_csv(RAW_FILE, dtype=str)
    df = df[df["Series Code"] == SERIES_ID]
    df.replace({"..": pd.NA, "": pd.NA}, inplace=True)

    tidy = (
        df.melt(
            id_vars=["Country Name", "Country Code"],
            value_vars=YEARS,
            var_name="Year",
            value_name="Ratio"
        )
        .dropna(subset=["Ratio"])
        .astype({"Year": int, "Ratio": float})
        .reset_index(drop=True)
    )

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    tidy.to_csv(OUT_FILE, index=False)
    print(f"  Wrote {OUT_FILE}  ({len(tidy):,} rows)")

if __name__ == "__main__":
    main()
