# The Car Deal-oog

The Car Deal-oog V2 is een complete, responsieve car webshop voor Web Programming 1. Het project combineert de eisen uit de docent-PDF met de aanvullende webshop-, diensten-, account- en backoffice-eisen.

## Project starten

1. Pak de ZIP uit.
2. Open **Index.html** in een moderne browser.
3. Voor de beste ervaring kunt u de map ook openen met de VS Code-extensie Live Server.
4. Er is geen installatie, database of internetverbinding nodig voor de kernfunctionaliteit. Google Maps en externe zijmenu-links hebben wel internet nodig.

## Technologieën

- HTML5
- CSS3
- JavaScript (vanilla, zonder jQuery)
- Bootstrap 5.2.3, lokaal in `bootstrap/css` en `bootstrap/js`
- Browser-localStorage voor lokale projectgegevens

Er zijn geen andere frameworks of JavaScript-libraries gebruikt.

## Belangrijkste pagina’s

- `Index.html`: afwijkende welkomstpagina, twee H1-koppen, geoptimaliseerde videohero, vier diensten, vier auto’s, 4-delige klikbare carrousel, tellers en promotievideo.
- `templates/about.html`: bedrijfsgegevens, contact, missie, visie, openingstijden, Google Maps en contactformulier.
- `templates/videos.html`: twee lokale MP4-video’s.
- `templates/game.html`: werkend Road Rush JavaScript Canvas-spel met bronvermelding.
- `templates/cars.html` en `car-details.html`: catalogus, filters en volledige specificaties.
- Vier aparte dienstenformulieren: verkopen, inkopen, huren en financiering/verzekering.
- `offer.html`: offerteaanvraag, gekoppeld aan de geselecteerde auto.
- `login.html`, `register.html`, `account.html`: accountflow.
- `backoffice.html`: Admin/Manager-dashboard.

## Mappenstructuur

`templates/` bevat alle overige HTML-pagina’s. `js/` bevat de losse logische modules. `bootstrap/` bevat Bootstrap 5.2.3 lokaal. `images/logo`, `images/cars` en `images/banners` organiseren de beelden. `videos/` bevat de lokale MP4-bestanden.

De CSS is bewust opgesplitst om onderhoud overzichtelijk te houden:

- `style.css`: tokens, reset en basis;
- `navigation.css`: navbar en merk-lockup;
- `hero.css`: videohero en paginaheaders;
- `components.css`: kaarten, carrousel, catalogus en zijmenu;
- `forms.css`: formulieren, detailweergave en accountschermen;
- `backoffice.css`: dashboard en tabellen;
- `experiences.css`: zoeken, game en reveal;
- `footer.css`: footer;
- `theme-dark.css`: zwarte/grijze premium themalaag met rode merkaccenten;
- `theme-light.css`: lichte witte themalaag met luxe blauwe accenten;
- `animations.css`: GPU-vriendelijke 3D-effecten;
- `responsive.css`: breakpoints, touch en reduced motion.

## Login

### Administrator

- E-mail: `admin@cardeal-oog.com`
- Gebruikersnaam: `Admin`
- Wachtwoord: `admin`

### Manager

- E-mail: `manager@cardeal-oog.com`
- Gebruikersnaam: `Manager`
- Wachtwoord: `manager2026`

De Admin heeft volledige toegang, kan auto’s toevoegen/bewerken/verwijderen, gebruikers aanmaken/beheren, rollen bekijken en alle aanvragen verwerken. De Manager kan auto’s bekijken/bewerken en offerte- en dienstaanvragen verwerken, maar kan geen auto’s toevoegen/verwijderen en geen gebruikers of rollen beheren.

Backoffice-links worden in zowel de hoofdnavigatie als de footer uitsluitend zichtbaar gemaakt voor een ingelogde Admin of Manager. Een klant of niet-ingelogde bezoeker kan de dashboardinhoud ook niet via het directe adres openen. Uitloggen wist de lokale sessie en stuurt terug naar de homepage.

Gebruikers die de Admin aanmaakt, kunnen meteen inloggen met het toegewezen e-mailadres of de gebruikersnaam en het gekozen wachtwoord.

## Auto’s beheren

Ga na Admin-login naar Backoffice > Auto’s. De modal ondersteunt toevoegen en bewerken; verwijderen vraagt eerst om bevestiging. De beheerder kiest zelf een autofoto vanaf het apparaat. Browser-ondersteunde beeldformaten worden lokaal gelezen en naar een compacte WebP-weergave geoptimaliseerd voordat ze worden opgeslagen. Alle velden, inclusief prijs, km-stand, motor, vermogen, kleur, beschrijving, foto en beschikbaarheid, worden in de catalogus en detailweergave gebruikt.

## Offertes

Een klant opent een auto, klikt op **Offerte aanvragen** en verstuurt het gevalideerde formulier. De aanvraag wordt lokaal opgeslagen, aan de auto gekoppeld en direct getoond in Backoffice > Offertes. Na verzending verschijnt de vereiste succes-popup; **OK** brengt de klant terug naar de homepage.

## Vier diensten

Elk dienstenformulier heeft eigen relevante velden en Bootstrap-validatie. Na verzending krijgt de aanvraag een referentienummer, verschijnt deze in Backoffice > Diensten en ziet de klant direct een succesmelding.

## Eenvoudige aanvraagflow

V2 toont geen Gmail-koppeling, e-mailpreview of technische outbox aan klanten. Een offerte of dienstaanvraag wordt gevalideerd, lokaal opgeslagen, in de backoffice getoond en afgerond met een duidelijke succesmelding. Dit houdt de gebruikersflow snel en overzichtelijk binnen de toegestane frontendtechnologieën.

## Responsive ontwerp

De lay-out gebruikt Bootstrap-containers, grid, navbar-collapse, cards, modals, tabs en responsive tables. Eigen breakpoints voorkomen horizontale scroll, stapelen formulieren en zijmenu’s, houden video/canvas binnen het scherm en maken dashboardtabs horizontaal bedienbaar op kleine toestellen. De themaschakelaar onthoudt de gekozen modus: donker gebruikt zwart, antraciet en rood; licht gebruikt wit, koelgrijs en blauw.

## JavaScript-modules

- `main.js`: algemene UI, persistente themaschakelaar, loading, reveal, 3D-tilt/parallax, video-performance, zoeken, modals en localStorage.
- `auth.js`: login, registratie, betrouwbare logout, sessie en rolcontrole.
- `cars.js`: seeddata, cards, filters en detailweergave.
- `services.js`: vier dienstenworkflows.
- `offers.js`: gekoppelde offerteaanvragen en popupredirect.
- `backoffice.js`: CRUD, handmatige foto-upload/optimalisatie, gebruikers, rollen en aanvragen.
- `game.js`: Road Rush Canvas-spel.

## Demo-beperkingen

- Gegevens staan alleen in de localStorage van de gebruikte browser en worden niet tussen apparaten gedeeld.
- Wachtwoorden zijn voor deze klassikale frontenddemo leesbaar in localStorage en dus niet productiegeschikt.
- Rollen en sessies worden in deze frontenddemo client-side gecontroleerd. Voor echte productiebeveiliging zijn een server, gehashte wachtwoorden en server-side autorisatie vereist.
- De website bevat geen echte betalings-, krediet-, e-mailserver- of databasekoppeling.
- De aangeleverde bedrijfsgegevens zijn fictieve demogegevens.
