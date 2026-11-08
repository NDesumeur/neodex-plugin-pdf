# NeoPDF

A PDF reader that also lets you annotate: pen, highlighter, notes and eraser, with text search. Your annotations are kept for each PDF, and you can save an annotated copy.

*Version française : [README.md](README.md)*

## Opening a PDF

- **Open a PDF**, or drag a file onto the page.
- A PDF opened from a website in NeoDex also shows in NeoPDF.
- The **Recent PDFs** list keeps the last 30, with their number of pages and annotations: **Open** for a file on your PC, **On the site** for a PDF from the internet. An annotated PDF stays in the list.
- Each PDF reopens at the page where you left it.

## Reading

- **Previous** and **next page**, or scroll with the mouse.
- **Zoom in**, **Zoom out** and **Width** (the full width of the window).
- **Find in PDF**: NeoDex's search (Ctrl+F) also finds text on pages not shown yet.

## Annotating

Pick a tool in the bar:

- **Scroll**: the reading tool, drawing nothing.
- **Pen**: draw freehand.
- **Highlighter**: a wide, transparent stroke for highlighting.
- **Note**: click to place a note at that spot on the page. Click a note to edit it; empty it to delete it.
- **Eraser**: click a stroke to erase it.

Six colours to choose from: red, yellow, green, blue, purple and black. **Undo** removes the last stroke or note.

## Saving

- **Save PDF**: a copy of the PDF as it is, handy for keeping a PDF read on a website.
- **Save annotated**: a copy of the PDF with your strokes and notes drawn on it. The original file is not changed.

## Data and sync

Your annotations (strokes and notes) and the recent PDFs list are stored by NeoDex, backed up and synced between your PCs when sync is on. Each PDF is recognised by its content: it finds its annotations again even if moved or renamed. On first launch, the plugin picks up what you already had in NeoDex.

## Install

In NeoDex: **NeoStore → Discover → NeoPDF → Install**.

Building a plugin: see the [NeoDex SDK](https://github.com/NDesumeur/neodex-sdk).
