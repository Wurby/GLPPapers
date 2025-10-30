# The Glenn L. Pearson Papers

A full-stack digital archive preserving the journals, letters, and writings of Glenn L. Pearson - religion professor, author of "Building Faith with the Book of Mormon," devoted Latter-day Saint, father, and grandfather.

This project digitally preserves content from Commodore 64 disk images (1982-1992), making accessible Glenn L. Pearson's extensive personal journals, correspondence, CES course materials, and book manuscripts.

## Project Names

**Witness** (Frontend) - Reflects Glenn L. Pearson's role as a witness through his journals and writings, and honors his faith as one who bore witness to gospel truths.

**Scribe** (Backend) - Honors his work as a writer, professor, and keeper of records. Like ancient scribes who preserved sacred texts, this application preserves and serves Glenn L. Pearson's legacy.

## Project Structure

```
GPA/
├── witness/ (Frontend)    # React + Vite + Tailwind CSS frontend
├── scribe/ (Backend)      # Java Spring Boot backend
│   ├── src/              # Java backend application
│   └── data-processing/  # C64 disk extraction tools and data
│       ├── bin/              # c1541 and petcat utilities
│       ├── 1982-1992 Commodore Data/  # Original .d64 disk images
│       ├── extracted_texts/           # Extracted and converted text files
│       ├── VICE.app/                  # Commodore 64 emulator
│       ├── x64sc.app/                 # Commodore 64 emulator
│       ├── extract_all_d64.sh        # Batch extraction script
│       └── test_single_disk.sh       # Single disk test script
└── README.md
```

## Getting Started

### Witness (Frontend)

The frontend provides a web interface for exploring Glenn L. Pearson's archived writings.

```bash
cd witness
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

### Scribe (Backend)

The backend API serves the archived content and metadata.

```bash
cd scribe
# Java build instructions coming soon
```

### Data Processing

The data processing tools extract and convert text from Commodore 64 .d64 disk images.

```bash
cd scribe/data-processing

# Extract all disks
./extract_all_d64.sh

# Test a single disk
./test_single_disk.sh
```

## Technology Stack

### Witness (Frontend)
- React 18
- Vite 7
- React Router 6
- Tailwind CSS

### Scribe (Backend)
- Java
- Spring Boot
- REST API

### Data Processing Tools
- c1541 - Commodore disk image utility
- petcat - PETSCII to ASCII converter
- Bash scripts for automation

## Archive Contents

This project preserves content from three boxes of Commodore 64 disk images:

- **Box 1 - KLP** (Karl L. Pearson - Glenn's son)
- **Box 2 - KLP** (Karl L. Pearson - Glenn's son)
- **Box 3 - GLP** (Glenn L. Pearson)

### Glenn L. Pearson's Archive (Box 3)

Glenn L. Pearson's disks contain:

- **Personal Journals** - Detailed accounts of his life, travels (including a 1992 trip to Germany), and daily observations
- **Letters and Correspondence** - Personal and professional communications
- **"Building Faith with the Book of Mormon"** - Complete manuscript of his published work
- **CES Course Materials** - Church Educational System teaching resources
- **First Drafts of Books** - Manuscripts and works in progress
- **Productivity Tools** - EasyScript word processor files and databases

## License

[Add license information]

## Contributors

[Add contributor information]
