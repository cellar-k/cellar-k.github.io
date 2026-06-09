# Cellar·K — Κατάλογος Κρασιών

Ψηφιακός δίγλωσσος (Ελληνικά / English) κατάλογος κρασιών για το **Cellar·K**.
Plain HTML/CSS/JS — χωρίς build, χωρίς backend, χωρίς συνδρομές. Σαρώνεις ένα QR →
βλέπεις τον κατάλογο με φωτογραφίες των φιαλών. Ενημερώνεις κρασιά/περιγραφές
αλλάζοντας το `wines.json` και κάνοντας push. Τέλος.

> A free-forever, no-backend bilingual wine catalogue. Scan a QR → see the bottles.
> Edit `wines.json`, push, done.

## Δομή / Files

```
catalogue/
├── index.html      # σκελετός σελίδας / markup
├── style.css       # χρώματα brand (ink · oxblood · gold · bone)
├── script.js       # φορτώνει wines.json, EL/EN toggle, αναζήτηση, φίλτρα
├── wines.json      # τα δεδομένα — ΕΔΩ κάνεις αλλαγές
└── assets/
    ├── logo-mark.png
    └── wines/       # φωτογραφίες φιαλών (.avif + .png ανά κρασί)
```

## Επεξεργασία καταλόγου / Edit the catalogue

Άνοιξε το `wines.json`. Κάθε κρασί είναι μία εγγραφή με δίγλωσσα πεδία:

```json
{
  "slug": "salina-bianco",
  "name": "Salina Bianco",
  "cat": "white",
  "grape": "Inzolia 50% · Catarratto 50%",
  "type_gr": "IGP Salina · Λευκό",   "type_en": "IGP Salina · White",
  "sweet_gr": "Ξηρό",                "sweet_en": "Dry",
  "note_gr": "Ηφαιστειακό λευκό…",   "note_en": "Volcanic white…",
  "abv": "12,5%", "serve_gr": "Σερβ. 8–10°C", "serve_en": "Serve 8–10°C"
}
```

- `cat` πρέπει να είναι ένα από: `white` · `rose` · `red` · `sparkling` · `sweet`.
- `slug` πρέπει να ταιριάζει με τα αρχεία φωτογραφίας: `assets/wines/<slug>.avif`
  και `assets/wines/<slug>.png`.
- Νέο κρασί; Πρόσθεσε την εγγραφή **και** βάλε δύο φωτογραφίες με το ίδιο `slug`.

### Τιμές / Prices

Κάθε κρασί έχει δύο τιμές (αριθμοί, με **τελεία** για τα δεκαδικά):

```json
"price_retail": 16.5,      // Λιανική — τελική τιμή με ΦΠΑ
"price_wholesale": 11.95   // Χονδρική — καθαρή τιμή ανά φιάλη (χωρίς ΦΠΑ)
```

### Δύο URL → δύο QR (Λιανική / Χονδρική)

Η τιμή που βλέπει ο επισκέπτης καθορίζεται από το **URL**, όχι από κουμπί — έτσι
κάθε κοινό έχει το δικό του QR και ο πελάτης λιανικής **δεν** μπορεί να δει τις
τιμές χονδρικής.

| Κοινό | URL | Τιμή |
| --- | --- | --- |
| Λιανική (πελάτες) | `…/catalogue/` | `price_retail` |
| Χονδρική (επιχειρήσεις) | `…/catalogue/?trade` | `price_wholesale` |

Φτιάξε **δύο** QR codes — ένα για κάθε URL. Δίνεις το `?trade` link/QR μόνο στους
επαγγελματίες πελάτες. (Δεκτά και `?wholesale`, `?xondriki`, `?b2b`.)

Για να απενεργοποιήσεις εντελώς τη χονδρική (το `?trade` να δείχνει λιανική), βάλε
`"show_wholesale": false` στο μπλοκ `pricing`. Αν αφήσεις μια τιμή `null`, εμφανίζεται «—».

## Τοπική προεπισκόπηση / Local preview

Το `fetch()` του `wines.json` δεν δουλεύει με `file://`, οπότε σήκωσε έναν μικρό server:

```bash
cd ~/Desktop/Stelios/projects/Kappas/catalogue
python3 -m http.server 8000
# άνοιξε http://localhost:8000
```

## Δημοσίευση δωρεάν / Deploy (free)

**GitHub Pages** — Repo → **Settings** → **Pages** → Source: `main` / root → Save.
Παίρνεις `https://<username>.github.io/<repo>/`. Αν αυτός ο φάκελος είναι
υποφάκελος, το URL τελειώνει σε `/catalogue/`.

**Cloudflare Pages** (εναλλακτικά) — Connect to Git → Framework: None →
Build output directory: `/` (ή `catalogue`). Κάθε `git push` ανεβάζει αυτόματα.

## QR

Φτιάξε QR (π.χ. qr-code-generator.com) που δείχνει στο URL της σελίδας. Τύπωσέ το.
Αν αργότερα αλλάξεις host, **μην** ξαναφτιάχνεις το QR — κράτα σταθερό το URL
(redirect ή custom domain).

## Χρώματα / Brand colours

`ink #141414` · `oxblood #4E0000` · `gold #BFA773` · `bone #E7E7E0` — ορίζονται ως
CSS variables στην κορυφή του `style.css`.
