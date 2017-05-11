

#PREM_TYP_DESC - subway or street
#  - misdemeanro felony
#OFNS_DESC
#

import pandas as pd

#filename= "nypd-freeze.csv"
filename= "trees.csv"


out = "tree-parsed.csv"
df = pd.read_csv(filename)
#keep_cols = ["Latitude","Longitude", "LAW_CAT_CD", "CMPLNT_FR_DT"]
keep_cols = ["latitude","longitude", "health"]
new_df = df[keep_cols]
new_df.to_csv(out, index=False)
