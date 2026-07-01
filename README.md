# Aditya Medhane — Portfolio

My personal site. Built with [Astro](https://astro.build/), styled with plain CSS, deployed on Vercel.

I kept it small on purpose. Ships almost no JavaScript, loads fast, and the whole thing is a handful of components.

## Stack

- **Astro 5** for the framework
- **Vanilla CSS** with custom properties for theming and a dark/light toggle
- **Vercel** for deploys

## Running it locally

You'll need Node 18+ and npm.

```bash
git clone https://github.com/flash1729/Aditya_Portfolio.git
cd Aditya_Portfolio
npm install
npm run dev
```

Then open `http://localhost:4321`.

## Structure

```text
src/
├── components/   # Hero, Dock, Now
├── layouts/      # Layout wrapper
├── pages/        # index.astro, life.astro
└── styles/       # global.css
public/           # images and logos
```

## License

Code is MIT. The content (text, images, anything personal) is mine, so please don't lift that.
