# RxNear

A pharmacy finder that helps users discover nearby pharmacies, view
pharmacy details, explore locations and routes, and browse emergency
contact numbers.

## Features

- Find nearby pharmacies.
- Search locations and view pharmacy details.
- View pharmacies on a map and explore routes.
- Browse emergency numbers by country.
- Choose between dark and light themes.

## Tech Stack

- React
- JavaScript
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Leaflet / React Leaflet
- Geoapify
- Framer Motion
- Lucide React
- emergency-numbers

## Project Structure

```text
public/
  rxnear_logo.png

src/
  animations/
  components/
  features/
    app/
    pharmacy/
  hooks/
  pages/
  services/
  constants.js
  main.jsx

index.html
package.json
```

## Getting Started

```bash
git clone https://github.com/Arman-Saif/RxNear.git
cd RxNear
npm install
```

Create a `.env` file in the project root and add your Geoapify API key:

```env
VITE_GEOAPIFY_API_KEY=your geoapify api key
```

Start the development server:

```bash
npm run dev
```

## License

This project is licensed under the [MIT License](LICENSE).
