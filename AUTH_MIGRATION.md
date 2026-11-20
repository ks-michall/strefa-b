# Strefa B — migracja logowania (przed wdrożeniem)

## Co zmieniono
- Hasła usunięto z `lib/auth.ts`; logowanie weryfikuje hasła poprzez `scrypt` z losową solą.
- Sesja to ciasteczko `HttpOnly`, `SameSite=Lax` i (na produkcji) `Secure`, podpisane HMAC-SHA256. Wygasa po 7 dniach.
- Middleware sprawdza podpis, datę ważności i użytkownika. Nie wystarcza już wpisanie imienia do cookie.
- Stare ciasteczko `strefa_b_user` nie daje dostępu do aplikacji.
- Błędy logowania nie ujawniają, czy konto istnieje.

## Wymagane kroki wdrożenia
1. **Nie scalaj tej zmiany przed ustawieniem sekretów**, bo nowa wersja nie przyjmie logowania bez konfiguracji.
2. Na swoim komputerze w sklonowanym repozytorium uruchom `node scripts/generate-auth-config.mjs`. Generator tworzy `.env.local` (ignorowany przez Git) i wyświetla jednorazowo nowe hasła.
3. Nie wysyłaj listy haseł przez publiczny czat ani nie dodawaj `.env.local` do GitHuba. Przekaż uczniom indywidualnie nowe hasła.
4. W panelu Vercel → Project → Settings → Environment Variables ustaw dla **Production**:
   - `STREFA_B_SESSION_SECRET` — losowy sekret z `.env.local`
   - `STREFA_B_PASSWORD_HASHES` — JSON z `.env.local`, **bez zewnętrznych apostrofów**.
5. Ustaw te wartości także dla Preview, jeżeli chcesz testować podglądy, najlepiej jako osobne sekrety.
6. Przeprowadź test logowania, wylogowania, dostępu bez ciasteczka, ze zmienionym ciasteczkiem i po 7 dniach, a także podstawowe testy Bohaterów, Bajek i Bonsai.
7. Dopiero wtedy scal i wdróż. Wszystkie dotychczasowe sesje utracą ważność; stare hasła przestaną działać.
8. Jeśli dotychczasowe hasła były stosowane także w innych miejscach, należy je tam zmienić.

## Ograniczenia / prace do wykonania
- **Nie wykonano migracji bazy Supabase.** Obecne moduły korzystają po stronie przeglądarki z publicznego klucza anon. Sprawdź obowiązujące polityki RLS dla każdej tabeli — podpisane cookie Strefy B nie jest automatycznie rozpoznawane przez Supabase. Dla bezpiecznej identyfikacji autora rozważ przejście na obsługę zapisów przez serwer z autoryzacją użytkownika i rygorystycznymi uprawnieniami.
- Brakuje globalnego limitowania prób logowania (np. w zewnętrznym magazynie danych). Zabezpieczenie przed atakami na hasła należy dodać przed wdrożeniem publicznym.
- Podpisane ciasteczko nie jest unieważniane w innych urządzeniach po zwykłym wylogowaniu. Aby wymusić globalne wylogowanie, zmień sekret sesji. Docelowo rozważ sesje przechowywane na serwerze z możliwością ich odwołania.
- Wcześniejsze hasła zostały ujawnione w historii publicznego repozytorium; samo usunięcie ich z aktualnego kodu nie jest rotacją — nowe hasła są obowiązkowe.
- Bonsai w tej wersji zapisuje postęp tylko lokalnie na urządzeniu; nie przechowuj tam poufnych refleksji.

## Weryfikacja
Z poziomu projektu uruchom `npm ci`, `npm run lint` i `npm run build`. Przed połączeniem z `main` sprawdź wynik z GitHub Actions lub podglądu Vercel.
