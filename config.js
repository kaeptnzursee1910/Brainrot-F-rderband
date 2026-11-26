/* Online-Funktionen (Konto, Spielstand im Konto, Bestenliste)
   Werte aus Supabase → Project Settings → API eintragen.
   Der "anon public"-Schlüssel ist öffentlich gedacht und darf hier stehen –
   geschützt werden die Daten durch die Regeln in supabase/schema.sql.
   Leer lassen = Spiel läuft nur lokal (ohne Konten). */
window.BRAINROT_CONFIG = {
  supabaseUrl: "https://npfnwcerbzlcwuzwvpqw.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZm53Y2VyYnpsY3d1end2cHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTQ4NDcsImV4cCI6MjExMTI3MDg0N30.DfDa_UX8kc0RKdE8tL9WPgAs7lDurX5scb-CoEw4n2k",
  // Spieler melden sich nur mit Spielername an; intern wird daraus
  // "<name>@<usernameEmailDomain>" gemacht (es wird keine E-Mail verschickt).
  usernameEmailDomain: "spieler.brainrot-fliessband.de"
};
