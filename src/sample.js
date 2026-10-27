export function createSample() {
  const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 600;
  const ctx = canvas.getContext('2d');
  const text = (value, x, y, size = 14, color = '#30302c', weight = 400) => { ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.fillStyle = color; ctx.fillText(value, x, y); };
  const box = (x, y, w, h, color, radius = 0) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); };
  box(0, 0, 960, 600, '#fcfcfa'); box(0, 0, 190, 600, '#f1f1ec');
  box(24, 27, 28, 28, '#4c6955', 8); text('N', 31, 47, 18, '#fff', 650); text('Notebook', 64, 48, 18, '#30372e', 650);
  text('WORKSPACE', 26, 104, 10, '#818477', 600);
  box(14, 122, 162, 36, '#e2e6da', 6); text('Overview', 28, 145, 13, '#364630', 600);
  text('Projects', 28, 187, 13, '#64685c'); text('Archive', 28, 229, 13, '#64685c');
  text('PERSONAL', 26, 304, 10, '#818477', 600); text('Reading list', 28, 343, 13, '#64685c'); text('Ideas', 28, 385, 13, '#64685c');
  box(25, 543, 25, 25, '#d3d9cb', 13); text('JD', 29, 560, 10, '#4b5945', 600); text('Jamie Davis', 61, 560, 12, '#5a6053');
  text('Personal / Overview', 232, 44, 12, '#818477'); text('A little room to think.', 232, 115, 31, '#30372e', 600);
  text('Notes, lists, and the things you want to come back to.', 232, 148, 14, '#85877e');
  const cards = [
    [232, 192, '#eceee4', 'THIS WEEK', 'Make space for the work', 'Three things. One at a time.', 'Updated today'],
    [578, 192, '#eee7de', 'IDEAS', 'A small collection', 'Keep the rough edges for now.', '8 notes'],
    [232, 382, '#e4ebec', 'READING', 'On the bookshelf', 'A few pages before the day starts.', '12 books'],
    [578, 382, '#ebe6e9', 'PERSONAL', 'Weekend plans', 'Something outside, hopefully.', 'Updated yesterday'],
  ];
  for (const [x, y, color, label, title, body, meta] of cards) {
    box(x, y, 310, 158, color, 12); text(label, x + 20, y + 31, 10, '#74786e', 650);
    text(title, x + 20, y + 66, 18, '#333b31', 600); text(body, x + 20, y + 93, 12, '#74786e'); text(meta, x + 20, y + 134, 10, '#85877d');
  }
  return canvas;
}
