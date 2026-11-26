/* Online-Funktionen (Konto, Spielstand im Konto, Bestenliste)
   Werte aus Supabase → Project Settings → API eintragen.
   Der "anon public"-Schlüssel ist öffentlich gedacht und darf hier stehen –
   geschützt werden die Daten durch die Regeln in supabase/schema.sql.
   Leer lassen = Spiel läuft nur lokal (ohne Konten). */
window.BRAINROT_CONFIG = {
  supabaseUrl: "https://npfnwcerbzlcwuzwvpqw.supabase.co",
  supabaseAnonKey: "",    // langer Schlüssel, beginnt meist mit "eyJ..."
  // Spieler melden sich nur mit Spielername an; intern wird daraus
  // "<name>@<usernameEmailDomain>" gemacht (es wird keine E-Mail verschickt).
  usernameEmailDomain: "spieler.brainrot-fliessband.de"
};
