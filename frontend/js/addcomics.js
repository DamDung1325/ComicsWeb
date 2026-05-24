document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('add-comic-form');

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const comic = {

      id: Number(document.getElementById('comic-id').value),

      title: document.getElementById('comic-title').value,

      slug: document
        .getElementById('comic-title')
        .value
        .toLowerCase()
        .replace(/\s+/g, '-'),

      description: document.getElementById('comic-description').value,

      coverImage: "assets/images/placeholder.svg",

      author: document.getElementById('comic-author').value,

      artist: document.getElementById('comic-artist').value,

      genres: document
        .getElementById('comic-genres')
        .value
        .split(',')
        .map(g => g.trim()),

      status: "ongoing",

      rating: 5,

      views: 0,

      totalChapters: 0,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()
    };

    try {

      // DÙNG API MODULE
      await createComic(comic);

      alert('Thêm truyện thành công!');

      // quay về dashboard
      window.location.href = './dashboard.html';

    } catch (err) {

      console.error(err);

      alert('Không thể thêm truyện');

    }

  });

});