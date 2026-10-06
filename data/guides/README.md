# Guide files for the knowledge base

Put one plain-text file per guide in this folder, named something like
`pau-tomato-diseases.txt`. The embeddings script reads every `.txt` file here.

Start each file with two header lines, then paste the text:

```
source: PAU Package of Practices for Vegetables, 2025
url: https://www.pau.edu
<paste the guide text here>
```

How to get the text out of a PDF:
- Open the PDF, select the disease section, and copy and paste it, or
- run `pdftotext guide.pdf guide.txt` (from poppler-utils) and trim it.

Keep only the parts about diseases, symptoms and control of your chosen crops.
Smaller, focused files give better retrieval than whole 300-page manuals.

After adding or changing files, run `npm run embed` to rebuild `data/embeddings.json`.
