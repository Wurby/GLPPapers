# Scribe

**Backend API for The Glenn L. Pearson Papers**

The name "Scribe" honors Glenn L. Pearson's work as a writer, religion professor, and keeper of records. Like the ancient scribes who preserved sacred texts and histories, this application serves to preserve and make accessible Glenn L. Pearson's journals, letters, and teachings.

## Structure

```
scribe/
├── src/
│   ├── main/
│   │   ├── java/          # Java source code
│   │   └── resources/     # Application resources
│   └── test/
│       └── java/          # Test code
└── data-processing/       # C64 data extraction tools
    ├── bin/               # c1541 and petcat utilities
    ├── 1982-1992 Commodore Data/  # Original disk images
    ├── extracted_texts/   # Extracted content
    └── *.sh              # Extraction scripts
```

## Setup

Java backend setup coming soon. Likely using Spring Boot for REST API.

## Data Processing

The `data-processing/` directory contains tools for extracting and converting content from Commodore 64 disk images:

- **c1541**: Commodore 1541 disk image utility for extracting files from .d64 images
- **petcat**: Converts PETSCII (Commodore's character encoding) to ASCII
- **extract_all_d64.sh**: Batch processes all disk images in the archive
- **test_single_disk.sh**: Tests extraction on a single disk

### Running the Extraction

```bash
cd data-processing
./extract_all_d64.sh
```

This will extract all files from the .d64 disk images and convert PETSCII text files to readable ASCII format.

## API (Planned)

The backend will expose a REST API for:
- Browsing the archive by box/disk
- Searching extracted content
- Viewing file metadata
- Serving extracted text and images
