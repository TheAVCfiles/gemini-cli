# Roberto Prati Evidence Map

This repository now includes a helper script that recreates the evidence map for
Roberto (Robert) Prati, Marquis of Rovagnasca. The diagram can be exported as a
PDF by invoking the script from the project root:

```bash
python scripts/generate_prati_evidence_map.py --output artifacts/Prati_Evidence_Map_v5.pdf
```

If the `--output` argument is omitted the PDF will be written to
`Prati_Evidence_Map_v5.pdf` in the current working directory. The script
requires the [graphviz Python package](https://graphviz.readthedocs.io/en/stable/) and
the Graphviz binaries to be installed and available on your system path.

The rendered diagram captures the relationships between the Prati family,
associated residences, and the documentary sources that substantiate each fact.
