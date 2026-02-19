import pandas as pd
import sys

try:
    file_path = 'מערכות מורים תשפו.xlsx'
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {', '.join(xl.sheet_names)}")
    
    for sheet_name in xl.sheet_names[:1]: # Just first sheet for now
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(df.head(10).to_string())
except Exception as e:
    print(f"Error: {e}")
