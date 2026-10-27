# Contributing

Run the syntax check, tests, and build listed in the README before submitting a change. Add a regression test for layout or validation bugs. For rendering changes, compare a downloaded PNG with a known input and run the relevant steps in [docs/testing.md](docs/testing.md).

Keep processing in the browser and avoid network dependencies. The preview and export must continue to share the same renderer. Use synthetic images in tests and bug reports.
