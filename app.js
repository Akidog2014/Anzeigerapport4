"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG 7.0
 * APP.JS
 * =========================================================
 */


const APP_VERSION =
    "7.0";


const MAIL_EMPFAENGER =
    "marco.wueest@lu.ch";


const AUTOSAVE_DELAY =
    700;


const INACTIVITY_TIMEOUT =
    5 * 60 * 1000;


let formIndex = 0;

let alleDaten = [];

let saveTimer = null;

let letzteSpeicherung =
    null;

let appGesperrt =
    false;


/* =========================================================
   HILFSFUNKTIONEN
========================================================= */

function $(selector, parent = document) {

    return parent.querySelector(
        selector
    );

}


function status(
    text,
    typ = ""
) {

    const el =
        document.getElementById(
            "status"
        );

    el.textContent =
        text;

    el.className =
        "status";

    if (typ) {

        el.classList.add(
            typ
        );

    }

}


/* =========================================================
   DATUM FORMATIEREN
========================================================= */

function formatDate(event) {

    let value =
        event.target.value
            .replace(
                /[^\d]/g,
                ""
            );


    if (
        value.length > 2
    ) {

        value =
            value.slice(
                0,
                2
            )
            + "."
            + value.slice(2);

    }


    if (
        value.length > 5
    ) {

        value =
            value.slice(
                0,
                5
            )
            + "."
            + value.slice(5);

    }


    event.target.value =
        value.slice(
            0,
            10
        );


    planeAutomatischeSpeicherung();

}


/* =========================================================
   FORMULAR ERSTELLEN
========================================================= */

function neuesFormular() {

    const container =
        document.getElementById(
            "formContainer"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "person-form";


    div.innerHTML = `

        <h3>Person ${formIndex + 1}</h3>

        <label>
            Ort:
            <input
                type="text"
                name="ort_person"
                maxlength="150">
        </label>

        <label>
            Nachname:
            <input
                type="text"
                name="nachname"
                maxlength="100"
                required>
        </label>

        <label>
            Vorname:
            <input
                type="text"
                name="vorname"
                maxlength="100"
                required>
        </label>

        <label>
            Geburtsdatum:
            <input
                type="text"
                name="geburtsdatum"
                placeholder="DD.MM.JJJJ"
                inputmode="numeric"
                maxlength="10"
                required>
        </label>

        <label>
            Telefonnummer:
            <input
                type="tel"
                name="telefonnummer"
                maxlength="50">
        </label>

        <button
            type="button"
            class="btn-zusatz">

            ➕ Noch nicht erfasst im myAbi

        </button>

        <div class="zusatzfelder">

            <label>
                Strasse:
                <input
                    type="text"
                    name="strasse"
                    maxlength="150">
            </label>

            <label>
                PLZ:
                <input
                    type="text"
                    name="plz"
                    maxlength="20">
            </label>

            <label>
                Ort:
                <input
                    type="text"
                    name="ort"
                    maxlength="150">
            </label>

            <label>
                Vorname Vater:
                <input
                    type="text"
                    name="vater_vorname"
                    maxlength="100">
            </label>

            <label>
                Nachname Vater:
                <input
                    type="text"
                    name="vater_nachname"
                    maxlength="100">
            </label>

            <label>
                Vorname Mutter:
                <input
                    type="text"
                    name="mutter_vorname"
                    maxlength="100">
            </label>

            <label>
                Nachname Mutter:
                <input
                    type="text"
                    name="mutter_nachname"
                    maxlength="100">
            </label>

            <label>
                Geburtsort:
                <input
                    type="text"
                    name="geburtsort"
                    maxlength="150">
            </label>

            <label>
                Heimatort:
                <input
                    type="text"
                    name="heimatort"
                    maxlength="150">
            </label>

            <label>
                Beruf:
                <input
                    type="text"
                    name="beruf"
                    maxlength="150">
            </label>

        </div>


        <label>

            Notizen:

            <textarea
                name="notizen"
                rows="4"
                maxlength="5000"></textarea>

        </label>


        <!-- AUSSAGEN -->

        <button
            type="button"
            class="btn-aussage">

            🗣️ Aussagen erfassen

        </button>


        <div class="aussage-hinweis">

            <strong>
                Hinweis zur Aussage:
            </strong>

            <p>

                Gegen Sie ist ein Vorverfahren wegen
                …..... eingeleitet worden.

            </p>

            <ul>

                <li>
                    Sie können Aussage und Mitwirkung
                    verweigern. Ihre Aussagen können als
                    Beweismittel verwendet werden.
                </li>

                <li>
                    Sie können jederzeit eine Verteidigung
                    nach freier Wahl und auf Ihre Kosten
                    beiziehen oder eine amtliche Verteidigung
                    beantragen.
                </li>

                <li>
                    Sie haben das Recht mit Ihrer Verteidigung
                    frei zu verkehren.
                </li>

                <li>
                    Sie haben das Recht, einen Übersetzer
                    zu verlangen.
                </li>

            </ul>

        </div>


        <div class="aussagenfelder">

            <label>
                Datum Aussage:
                <input
                    type="text"
                    name="aussage_datum"
                    readonly>
            </label>

            <label>
                Zeit Aussage:
                <input
                    type="time"
                    name="aussage_zeit">
            </label>

            <label>

                Aussage:

                <textarea
                    name="aussage_text"
                    rows="5"
                    maxlength="10000"
                    placeholder="Aussage hier einfügen"></textarea>

            </label>

        </div>


        <!-- FINANZEN -->

        <button
            type="button"
            class="btn-finanz">

            💰 Finanzielle Verhältnisse

        </button>


        <div class="finanzfelder">

            <h4>
                Finanzielle Verhältnisse
            </h4>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="selbstaendig">

                <span>
                    Selbstständig
                </span>

            </div>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="angestellt">

                <span>
                    Angestellt
                </span>

            </div>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="anderes_einkommen">

                <span>
                    Anderes Einkommen
                </span>

            </div>


            <input
                type="text"
                name="anderes_einkommen_text"
                maxlength="300"
                placeholder="Bitte spezifizieren"
                style="display:none;">


            <label>

                Netto-Einkünfte pro Monat:

                <input
                    type="text"
                    name="netto_einkommen"
                    maxlength="100">

            </label>


            <label>

                Netto-Einkünfte Lebenspartner
                pro Monat:

                <input
                    type="text"
                    name="netto_partner"
                    maxlength="100">

            </label>


            <hr>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="liegenschaft_check">

                <span>

                    Liegenschaft:
                    <strong
                        class="ja-nein-liegenschaft">
                        Nein
                    </strong>

                </span>

            </div>


            <div
                class="liegenschaft_details finanz-detail">

                <label>

                    Ort:

                    <input
                        type="text"
                        name="liegenschaft_ort"
                        maxlength="150">

                </label>

                <label>

                    Steuerwert:

                    <input
                        type="text"
                        name="steuerwert"
                        maxlength="100">

                </label>

                <label>

                    Hypothekarschulden:

                    <input
                        type="text"
                        name="hypothek"
                        maxlength="100">

                </label>

            </div>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="anderes_vermoegen_check">

                <span>

                    Vermögen:
                    <strong
                        class="ja-nein-vermoegen">
                        Nein
                    </strong>

                </span>

            </div>


            <div
                class="anderes_vermoegen_details finanz-detail">

                <label>

                    Welches:

                    <input
                        type="text"
                        name="anderes_vermoegen_what"
                        maxlength="300">

                </label>

                <label>

                    CHF:

                    <input
                        type="text"
                        name="anderes_vermoegen_chf"
                        maxlength="100">

                </label>

            </div>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="unterhaltsbeitrag_check">

                <span>

                    Zu leistende
                    Unterhaltsbeiträge:

                    <strong
                        class="ja-nein-unterhalt">
                        Nein
                    </strong>

                </span>

            </div>


            <div
                class="unterhaltsbeitrag_details finanz-detail">

                <label>

                    Total pro Monat:

                    <input
                        type="text"
                        name="unterhalt_total"
                        maxlength="100">

                </label>

                <label>

                    An:

                    <input
                        type="text"
                        name="unterhalt_an"
                        maxlength="200">

                </label>

            </div>


            <div class="checkbox-zeile">

                <input
                    type="checkbox"
                    name="kinder_check">

                <span>

                    Kinder:
                    <strong
                        class="ja-nein-kinder">
                        Nein
                    </strong>

                </span>

            </div>


            <div
                class="kinder_details finanz-detail">

                <label>

                    Anzahl Kinder:

                    <input
                        type="number"
                        name="kinder_anzahl"
                        min="0"
                        max="50">

                </label>

                <label>

                    Jahrgang Kinder:

                    <input
                        type="text"
                        name="kinder_jahrgang"
                        maxlength="300"
                        placeholder="z.B. 2010, 2013, 2017">

                </label>

            </div>

        </div>
    `;


    container.appendChild(
        div
    );


    formIndex++;


    aktiviereFormular(
        div
    );


    planeAutomatischeSpeicherung();

}


/* =========================================================
   FORMULAR EVENTS
========================================================= */

function aktiviereFormular(
    form
) {

    const dateInput =
        $('input[name="geburtsdatum"]', form);


    dateInput.addEventListener(
        "input",
        formatDate
    );


    const zusatzButton =
        $(".btn-zusatz", form);


    zusatzButton.addEventListener(
        "click",
        () => {

            $(".zusatzfelder", form)
                .style.display =
                "block";

            zusatzButton.style.display =
                "none";

            planeAutomatischeSpeicherung();

        }
    );


    const aussageButton =
        $(".btn-aussage", form);


    aussageButton.addEventListener(
        "click",
        () => {

            $(".aussage-hinweis", form)
                .style.display =
                "block";

            $(".aussagenfelder", form)
                .style.display =
                "block";


            const jetzt =
                new Date();


            $('input[name="aussage_datum"]', form)
                .value =
                jetzt.toLocaleDateString(
                    "de-CH"
                );


            $('input[name="aussage_zeit"]', form)
                .value =
                jetzt.toLocaleTimeString(
                    "de-CH",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            aussageButton.style.display =
                "none";


            planeAutomatischeSpeicherung();

        }
    );


    const finanzButton =
        $(".btn-finanz", form);


    finanzButton.addEventListener(
        "click",
        () => {

            $(".finanzfelder", form)
                .style.display =
                "block";

            finanzButton.style.display =
                "none";

            planeAutomatischeSpeicherung();

        }
    );


    const selbstaendig =
        $('input[name="selbstaendig"]', form);


    const angestellt =
        $('input[name="angestellt"]', form);


    const anderes =
        $('input[name="anderes_einkommen"]', form);


    selbstaendig.addEventListener(
        "change",
        () => {

            if (
                selbstaendig.checked
            ) {

                angestellt.checked =
                    false;

                anderes.checked =
                    false;

            }

            zeigeAnderesText(
                anderes,
                form
            );

            planeAutomatischeSpeicherung();

        }
    );


    angestellt.addEventListener(
        "change",
        () => {

            if (
                angestellt.checked
            ) {

                selbstaendig.checked =
                    false;

                anderes.checked =
                    false;

            }

            zeigeAnderesText(
                anderes,
                form
            );

            planeAutomatischeSpeicherung();

        }
    );


    anderes.addEventListener(
        "change",
        () => {

            if (
                anderes.checked
            ) {

                selbstaendig.checked =
                    false;

                angestellt.checked =
                    false;

            }

            zeigeAnderesText(
                anderes,
                form
            );

            planeAutomatischeSpeicherung();

        }
    );


    const checkboxen = [

        [
            "liegenschaft_check",
            "liegenschaft_details",
            "ja-nein-liegenschaft"
        ],

        [
            "anderes_vermoegen_check",
            "anderes_vermoegen_details",
            "ja-nein-vermoegen"
        ],

        [
            "unterhaltsbeitrag_check",
            "unterhaltsbeitrag_details",
            "ja-nein-unterhalt"
        ],

        [
            "kinder_check",
            "kinder_details",
            "ja-nein-kinder"
        ]

    ];


    checkboxen.forEach(
        (
            [
                checkboxName,
                detailName,
                labelName
            ]
        ) => {

            const checkbox =
                $(
                    `input[name="${checkboxName}"]`,
                    form
                );


            checkbox.addEventListener(
                "change",
                () => {

                    const detail =
                        $(
                            "." + detailName,
                            form
                        );


                    const label =
                        $(
                            "." + labelName,
                            form
                        );


                    detail.style.display =
                        checkbox.checked
                            ? "block"
                            : "none";


                    label.textContent =
                        checkbox.checked
                            ? "Ja"
                            : "Nein";


                    planeAutomatischeSpeicherung();

                }
            );

        }
    );


    /*
     * Änderungen aller Eingabefelder überwachen.
     */

    form.addEventListener(
        "input",
        () => {

            planeAutomatischeSpeicherung();

        }
    );


    form.addEventListener(
        "change",
        () => {

            planeAutomatischeSpeicherung();

        }
    );

}


/* =========================================================
   ANDERES EINKOMMEN
========================================================= */

function zeigeAnderesText(
    checkbox,
    form
) {

    const text =
        $('input[name="anderes_einkommen_text"]', form);


    text.style.display =
        checkbox.checked
            ? "block"
            : "none";

}


/* =========================================================
   FORMULARDATEN LESEN
========================================================= */

function datenAusFormularenSpeichern() {

    const personen = [];


    const forms =
        document.querySelectorAll(
            ".person-form"
        );


    forms.forEach(
        form => {

            let finanzDaten =
                null;


            const finanz =
                $(".finanzfelder", form);


            if (
                finanz &&
                getComputedStyle(finanz).display !== "none"
            ) {

                finanzDaten = {

                    selbstaendig:
                        $('input[name="selbstaendig"]', form)
                            .checked,

                    angestellt:
                        $('input[name="angestellt"]', form)
                            .checked,

                    anderes:
                        $('input[name="anderes_einkommen"]', form)
                            .checked,

                    anderes_text:
                        $('input[name="anderes_einkommen_text"]', form)
                            .value,

                    netto_einkommen:
                        $('input[name="netto_einkommen"]', form)
                            .value,

                    netto_partner:
                        $('input[name="netto_partner"]', form)
                            .value,

                    liegenschaft:
                        $('input[name="liegenschaft_check"]', form)
                            .checked,

                    liegenschaft_ort:
                        $('input[name="liegenschaft_ort"]', form)
                            .value,

                    steuerwert:
                        $('input[name="steuerwert"]', form)
                            .value,

                    hypothek:
                        $('input[name="hypothek"]', form)
                            .value,

                    anderes_vermoegen:
                        $('input[name="anderes_vermoegen_check"]', form)
                            .checked,

                    anderes_vermoegen_what:
                        $('input[name="anderes_vermoegen_what"]', form)
                            .value,

                    anderes_vermoegen_chf:
                        $('input[name="anderes_vermoegen_chf"]', form)
                            .value,

                    unterhaltsbeitrag:
                        $('input[name="unterhaltsbeitrag_check"]', form)
                            .checked,

                    unterhalt_total:
                        $('input[name="unterhalt_total"]', form)
                            .value,

                    unterhalt_an:
                        $('input[name="unterhalt_an"]', form)
                            .value,

                    kinder:
                        $('input[name="kinder_check"]', form)
                            .checked,

                    kinder_anzahl:
                        $('input[name="kinder_anzahl"]', form)
                            .value,

                    kinder_jahrgang:
                        $('input[name="kinder_jahrgang"]', form)
                            .value

                };

            }


            personen.push({

                ort_person:
                    $('input[name="ort_person"]', form)
                        .value,

                vorname:
                    $('input[name="vorname"]', form)
                        .value,

                nachname:
                    $('input[name="nachname"]', form)
                        .value,

                geburtsdatum:
                    $('input[name="geburtsdatum"]', form)
                        .value,

                telefonnummer:
                    $('input[name="telefonnummer"]', form)
                        .value,

                hatZusatz:
                    $(".zusatzfelder", form)
                        .style.display === "block",

                strasse:
                    $('input[name="strasse"]', form)
                        .value,

                plz:
                    $('input[name="plz"]', form)
                        .value,

                ort:
                    $('input[name="ort"]', form)
                        .value,

                vater_vorname:
                    $('input[name="vater_vorname"]', form)
                        .value,

                vater_nachname:
                    $('input[name="vater_nachname"]', form)
                        .value,

                mutter_vorname:
                    $('input[name="mutter_vorname"]', form)
                        .value,

                mutter_nachname:
                    $('input[name="mutter_nachname"]', form)
                        .value,

                geburtsort:
                    $('input[name="geburtsort"]', form)
                        .value,

                heimatort:
                    $('input[name="heimatort"]', form)
                        .value,

                beruf:
                    $('input[name="beruf"]', form)
                        .value,

                notizen:
                    $('textarea[name="notizen"]', form)
                        .value,

                aussage_datum:
                    $('input[name="aussage_datum"]', form)
                        .value,

                aussage_zeit:
                    $('input[name="aussage_zeit"]', form)
                        .value,

                aussage_text:
                    $('textarea[name="aussage_text"]', form)
                        .value,

                finanz:
                    finanzDaten

            });

        }
    );


    alleDaten =
        personen;


    return personen;

}


/* =========================================================
   AUTOMATISCHES SPEICHERN PLANEN
========================================================= */

function planeAutomatischeSpeicherung() {

    if (
        appGesperrt
    ) {

        return;

    }


    clearTimeout(
        saveTimer
    );


    status(
        "⏳ Änderung erkannt – wird automatisch gespeichert …",
        "warn"
    );


    saveTimer =
        setTimeout(
            automatischeSpeicherung,
            AUTOSAVE_DELAY
        );

}


/* =========================================================
   AUTOMATISCH SPEICHERN
========================================================= */

async function automatischeSpeicherung() {

    if (
        appGesperrt
    ) {

        return;

    }


    try {

        const daten =
            datenAusFormularenSpeichern();


        await speichereVerschluesselteDaten(
            daten
        );


        letzteSpeicherung =
            new Date();


        const zeit =
            letzteSpeicherung.toLocaleTimeString(
                "de-CH",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        $("#letzteSpeicherung")
            .textContent =
            `Zuletzt gespeichert: ${zeit}`;


        status(
            "🔐 Automatisch verschlüsselt gespeichert.",
            "ok"
        );

    }
    catch (error) {

        console.error(
            "Automatische Speicherung fehlgeschlagen."
        );


        status(
            "❌ Automatische Speicherung fehlgeschlagen.",
            "error"
        );

    }

}


/* =========================================================
   DATEN WIEDERHERSTELLEN
========================================================= */

async function datenWiederherstellen() {

    try {

        const daten =
            await ladeVerschluesselteDaten();


        if (
            !daten
        ) {

            neuesFormular();

            status(
                "🔐 Neue Datenerfassung bereit.",
                "ok"
            );

            return;

        }


        alleDaten =
            daten.personen;


        formularAusDatenAufbauen();


        if (
            daten.gespeichert
        ) {

            const datum =
                new Date(
                    daten.gespeichert
                );


            if (
                !Number.isNaN(
                    datum.getTime()
                )
            ) {

                $("#letzteSpeicherung")
                    .textContent =
                    "Letzte Speicherung: " +
                    datum.toLocaleTimeString(
                        "de-CH",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        }
                    );

            }

        }


        status(
            "🔓 Gespeicherte Daten wurden automatisch wiederhergestellt.",
            "ok"
        );

    }
    catch (error) {

        console.error(
            "Wiederherstellung fehlgeschlagen."
        );


        status(
            "❌ Gespeicherte Daten konnten nicht entschlüsselt werden.",
            "error"
        );


        alert(
            "Die lokalen Daten konnten nicht " +
            "wiederhergestellt werden.\n\n" +
            "Möglicherweise sind die gespeicherten " +
            "Daten beschädigt."
        );

    }

}


/* =========================================================
   FORMULAR AUS DATEN AUFBAUEN
========================================================= */

function formularAusDatenAufbauen() {

    const container =
        document.getElementById(
            "formContainer"
        );


    container.replaceChildren();


    formIndex =
        0;


    if (
        !alleDaten.length
    ) {

        neuesFormular();

        return;

    }


    alleDaten.forEach(
        person => {

            neuesFormular();


            const forms =
                document.querySelectorAll(
                    ".person-form"
                );


            const form =
                forms[
                    forms.length - 1
                ];


            function setValue(
                name,
                value
            ) {

                const element =
                    $(
                        `[name="${name}"]`,
                        form
                    );

                if (element) {

                    element.value =
                        value || "";

                }

            }


            setValue(
                "ort_person",
                person.ort_person
            );

            setValue(
                "vorname",
                person.vorname
            );

            setValue(
                "nachname",
                person.nachname
            );

            setValue(
                "geburtsdatum",
                person.geburtsdatum
            );

            setValue(
                "telefonnummer",
                person.telefonnummer
            );

            setValue(
                "strasse",
                person.strasse
            );

            setValue(
                "plz",
                person.plz
            );

            setValue(
                "ort",
                person.ort
            );

            setValue(
                "vater_vorname",
                person.vater_vorname
            );

            setValue(
                "vater_nachname",
                person.vater_nachname
            );

            setValue(
                "mutter_vorname",
                person.mutter_vorname
            );

            setValue(
                "mutter_nachname",
                person.mutter_nachname
            );

            setValue(
                "geburtsort",
                person.geburtsort
            );

            setValue(
                "heimatort",
                person.heimatort
            );

            setValue(
                "beruf",
                person.beruf
            );

            setValue(
                "aussage_datum",
                person.aussage_datum
            );

            setValue(
                "aussage_zeit",
                person.aussage_zeit
            );


            const notizen =
                $('textarea[name="notizen"]', form);


            if (notizen) {

                notizen.value =
                    person.notizen || "";

            }


            const aussage =
                $('textarea[name="aussage_text"]', form);


            if (aussage) {

                aussage.value =
                    person.aussage_text || "";

            }


            if (
                person.hatZusatz
            ) {

                $(".zusatzfelder", form)
                    .style.display =
                    "block";

                $(".btn-zusatz", form)
                    .style.display =
                    "none";

            }


            if (
                person.aussage_text &&
                person.aussage_text.trim()
            ) {

                $(".aussage-hinweis", form)
                    .style.display =
                    "block";

                $(".aussagenfelder", form)
                    .style.display =
                    "block";

                $(".btn-aussage", form)
                    .style.display =
                    "none";

            }


            if (
                person.finanz
            ) {

                const f =
                    person.finanz;


                const finanz =
                    $(".finanzfelder", form);


                finanz.style.display =
                    "block";


                $(".btn-finanz", form)
                    .style.display =
                    "none";


                function setChecked(
                    name,
                    value
                ) {

                    const element =
                        $(
                            `input[name="${name}"]`,
                            form
                        );

                    if (element) {

                        element.checked =
                            !!value;

                    }

                }


                setChecked(
                    "selbstaendig",
                    f.selbstaendig
                );

                setChecked(
                    "angestellt",
                    f.angestellt
                );

                setChecked(
                    "anderes_einkommen",
                    f.anderes
                );


                setValue(
                    "anderes_einkommen_text",
                    f.anderes_text
                );

                setValue(
                    "netto_einkommen",
                    f.netto_einkommen
                );

                setValue(
                    "netto_partner",
                    f.netto_partner
                );


                const anderesText =
                    $('input[name="anderes_einkommen_text"]', form);


                anderesText.style.display =
                    f.anderes
                        ? "block"
                        : "none";


                const checkboxen = [

                    [
                        "liegenschaft_check",
                        "liegenschaft_details",
                        "ja-nein-liegenschaft",
                        f.liegenschaft
                    ],

                    [
                        "anderes_vermoegen_check",
                        "anderes_vermoegen_details",
                        "ja-nein-vermoegen",
                        f.anderes_vermoegen
                    ],

                    [
                        "unterhaltsbeitrag_check",
                        "unterhaltsbeitrag_details",
                        "ja-nein-unterhalt",
                        f.unterhaltsbeitrag
                    ],

                    [
                        "kinder_check",
                        "kinder_details",
                        "ja-nein-kinder",
                        f.kinder
                    ]

                ];


                checkboxen.forEach(
                    item => {

                        const checkbox =
                            $(
                                `input[name="${item[0]}"]`,
                                form
                            );


                        const detail =
                            $(
                                "." + item[1],
                                form
                            );


                        const label =
                            $(
                                "." + item[2],
                                form
                            );


                        checkbox.checked =
                            !!item[3];


                        detail.style.display =
                            item[3]
                                ? "block"
                                : "none";


                        label.textContent =
                            item[3]
                                ? "Ja"
                                : "Nein";

                    }
                );


                setValue(
                    "liegenschaft_ort",
                    f.liegenschaft_ort
                );

                setValue(
                    "steuerwert",
                    f.steuerwert
                );

                setValue(
                    "hypothek",
                    f.hypothek
                );

                setValue(
                    "anderes_vermoegen_what",
                    f.anderes_vermoegen_what
                );

                setValue(
                    "anderes_vermoegen_chf",
                    f.anderes_vermoegen_chf
                );

                setValue(
                    "unterhalt_total",
                    f.unterhalt_total
                );

                setValue(
                    "unterhalt_an",
                    f.unterhalt_an
                );

                setValue(
                    "kinder_anzahl",
                    f.kinder_anzahl
                );

                setValue(
                    "kinder_jahrgang",
                    f.kinder_jahrgang
                );

            }

        }
    );

}


/* =========================================================
   ZUSATZMASKE
========================================================= */

function zeigeZusatzMaske() {

    datenAusFormularenSpeichern();


    if (
        !alleDaten.length
    ) {

        alert(
            "Es sind keine Personen vorhanden."
        );

        return;

    }


    const jetzt =
        new Date();


    $("#datum").value =
        jetzt.toLocaleDateString(
            "de-CH"
        );


    $("#zeit").value =
        jetzt.toLocaleTimeString(
            "de-CH",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    $("#zusatzMaske")
        .classList.remove(
            "hidden"
        );


    window.scrollTo(
        0,
        document.body.scrollHeight
    );

}


function versteckeZusatzMaske() {

    $("#zusatzMaske")
        .classList.add(
            "hidden"
        );

}


/* =========================================================
   E-MAIL
========================================================= */

function finaleMailAbschicken() {

    datenAusFormularenSpeichern();


    const datum =
        $("#datum").value;

    const zeit =
        $("#zeit").value;

    const ereignis =
        $("#ereignis").value;


    let betreff =
        `Personendaten ${datum}`;


    if (
        ereignis.trim()
    ) {

        betreff +=
            ` - ${ereignis.trim()}`;

    }


    let mailBody =
        `Datum: ${datum}\n` +
        `Zeit: ${zeit}\n` +
        `Ereignis: ${ereignis}\n\n` +
        `Erfasste Personen:\n\n`;


    alleDaten.forEach(
        (p, i) => {

            mailBody +=
                `==============================\n` +
                `PERSON ${i + 1}\n` +
                `==============================\n\n`;


            mailBody +=
                `Vorname: ${p.vorname}\n` +
                `Nachname: ${p.nachname}\n` +
                `Geburtsdatum: ${p.geburtsdatum}\n` +
                `Telefonnummer: ${p.telefonnummer}\n` +
                `Ort: ${p.ort_person || "Keine Angabe"}\n\n`;


            if (
                p.hatZusatz
            ) {

                mailBody +=
                    `--- Weitere Angaben ---\n` +
                    `Strasse: ${p.strasse}\n` +
                    `PLZ: ${p.plz}\n` +
                    `Ort: ${p.ort}\n` +
                    `Vater: ${p.vater_vorname} ${p.vater_nachname}\n` +
                    `Mutter: ${p.mutter_vorname} ${p.mutter_nachname}\n` +
                    `Geburtsort: ${p.geburtsort}\n` +
                    `Heimatort: ${p.heimatort}\n` +
                    `Beruf: ${p.beruf}\n\n`;

            }


            if (
                p.aussage_text &&
                p.aussage_text.trim()
            ) {

                mailBody +=
                    `--- Aussagen ---\n` +
                    `Aussage-Datum: ${p.aussage_datum}\n` +
                    `Aussage-Zeit: ${p.aussage_zeit}\n` +
                    `Aussage:\n${p.aussage_text}\n\n`;

            }


            if (
                p.finanz
            ) {

                const f =
                    p.finanz;


                if (
                    f.angestellt
                ) {

                    mailBody +=
                        `Erwerbsstatus: Angestellt\n`;

                }
                else if (
                    f.selbstaendig
                ) {

                    mailBody +=
                        `Erwerbsstatus: Selbstständig\n`;

                }
                else if (
                    f.anderes
                ) {

                    mailBody +=
                        `Erwerbsstatus: ${
                            f.anderes_text ||
                            "Anderes"
                        }\n`;

                }
                else {

                    mailBody +=
                        `Erwerbsstatus: Keine Angabe\n`;

                }


                mailBody +=
                    `Netto-Einkünfte pro Monat: ${
                        f.netto_einkommen ||
                        "Keine Angabe"
                    }\n` +

                    `Netto-Einkünfte Lebenspartner pro Monat: ${
                        f.netto_partner ||
                        "Keine Angabe"
                    }\n`;


                mailBody +=
                    `Liegenschaft: ${
                        f.liegenschaft
                            ? "Ja"
                            : "Nein"
                    }\n`;


                if (
                    f.liegenschaft
                ) {

                    mailBody +=
                        `  Ort: ${f.liegenschaft_ort}\n` +
                        `  Steuerwert: ${f.steuerwert}\n` +
                        `  Hypothekarschulden: ${f.hypothek}\n`;

                }


                mailBody +=
                    `Vermögen: ${
                        f.anderes_vermoegen
                            ? "Ja"
                            : "Nein"
                    }\n`;


                if (
                    f.anderes_vermoegen
                ) {

                    mailBody +=
                        `  Welches: ${
                            f.anderes_vermoegen_what
                        }\n` +

                        `  CHF: ${
                            f.anderes_vermoegen_chf
                        }\n`;

                }


                mailBody +=
                    `Zu leistende Unterhaltsbeiträge: ${
                        f.unterhaltsbeitrag
                            ? "Ja"
                            : "Nein"
                    }\n`;


                if (
                    f.unterhaltsbeitrag
                ) {

                    mailBody +=
                        `  Total pro Monat: ${
                            f.unterhalt_total
                        }\n` +

                        `  An: ${
                            f.unterhalt_an
                        }\n`;

                }


                mailBody +=
                    `Kinder: ${
                        f.kinder
                            ? "Ja"
                            : "Nein"
                    }\n`;


                if (
                    f.kinder
                ) {

                    mailBody +=
                        `  Anzahl Kinder: ${
                            f.kinder_anzahl
                        }\n` +

                        `  Jahrgang Kinder: ${
                            f.kinder_jahrgang
                        }\n`;

                }


                mailBody +=
                    "\n";

            }


            mailBody +=
                `--- Notizen ---\n` +
                `${p.notizen}\n\n`;

        }
    );


    const mailto =
        `mailto:${MAIL_EMPFAENGER}` +
        `?subject=${encodeURIComponent(
            betreff
        )}` +
        `&body=${encodeURIComponent(
            mailBody
        )}`;


    window.location.href =
        mailto;

}


/* =========================================================
   BACKUP EXPORT
========================================================= */

async function backupExportieren() {

    try {

        const daten =
            await backupDatenErstellen();


        const passwort =
            window.prompt(
                "Bitte ein Backup-Passwort eingeben.\n\n" +
                "Mindestens 12 Zeichen."
            );


        if (
            passwort === null
        ) {

            return;

        }


        if (
            passwort.length < 12
        ) {

            alert(
                "Das Backup-Passwort muss mindestens " +
                "12 Zeichen lang sein."
            );

            return;

        }


        const verschluesseltesBackup =
            await verschluesselnBackup(
                JSON.stringify(
                    daten
                ),
                passwort
            );


        const text =
            JSON.stringify(
                verschluesseltesBackup
            );


        const blob =
            new Blob(
                [text],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        const datum =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        link.href =
            url;


        link.download =
            `personenerfassung-backup-${datum}.enc`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        status(
            "📦 Verschlüsseltes Backup wurde erstellt.",
            "ok"
        );

    }
    catch (error) {

        console.error(
            "Backup konnte nicht erstellt werden."
        );


        status(
            "❌ Backup konnte nicht erstellt werden.",
            "error"
        );

        alert(
            "Das Backup konnte nicht erstellt werden."
        );

    }

}


/* =========================================================
   BACKUP IMPORT
========================================================= */

function backupImportStarten() {

    $("#backupDatei").click();

}


async function backupDateiVerarbeiten(
    event
) {

    const file =
        event.target.files[0];


    event.target.value =
        "";


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        const passwort =
            window.prompt(
                "Backup-Passwort eingeben:"
            );


        if (
            passwort === null
        ) {

            return;

        }


        const entschluesselterText =
            await entschluesselnBackup(
                backup,
                passwort
            );


        const daten =
            JSON.parse(
                entschluesselterText
            );


        if (
            !daten ||
            !Array.isArray(
                daten.personen
            )
        ) {

            throw new Error(
                "Ungültige Backup-Daten."
            );

        }


        const bestaetigung =
            window.confirm(

                "Das Backup wird als aktueller " +
                "Datenbestand übernommen.\n\n" +

                "Der bisherige lokale Datenbestand " +
                "wird dabei überschrieben.\n\n" +

                "Fortfahren?"

            );


        if (
            !bestaetigung
        ) {

            return;

        }


        await speichereVerschluesselteDaten(
            daten.personen
        );


        alleDaten =
            daten.personen;


        formularAusDatenAufbauen();


        status(
            "📥 Verschlüsseltes Backup wurde wiederhergestellt.",
            "ok"
        );

    }
    catch (error) {

        console.error(
            "Backup-Wiederherstellung fehlgeschlagen."
        );


        status(
            "❌ Backup konnte nicht wiederhergestellt werden.",
            "error"
        );


        alert(
            "Das Backup konnte nicht wiederhergestellt werden.\n\n" +
            "Möglicherweise ist das Passwort falsch " +
            "oder die Backup-Datei beschädigt."
        );

    }

}


/* =========================================================
   ALLES LÖSCHEN
========================================================= */

async function allesLoeschen() {

    const bestaetigung =
        window.confirm(

            "ACHTUNG!\n\n" +

            "Sollen wirklich alle lokalen " +
            "Personendaten gelöscht werden?\n\n" +

            "Auch der lokale Verschlüsselungsschlüssel " +
            "wird gelöscht.\n\n" +

            "Ein vorhandenes externes Backup bleibt " +
            "davon unberührt."

        );


    if (
        !bestaetigung
    ) {

        return;

    }


    try {

        await loescheAlleDaten();


        alleDaten =
            [];

        formIndex =
            0;


        document
            .getElementById(
                "formContainer"
            )
            .replaceChildren();


        neuesFormular();


        $("#ereignis")
            .value =
            "";


        versteckeZusatzMaske();


        $("#letzteSpeicherung")
            .textContent =
            "Noch nicht gespeichert";


        status(
            "🗑️ Alle lokalen Daten wurden gelöscht.",
            "ok"
        );

    }
    catch (error) {

        console.error(
            "Löschen fehlgeschlagen."
        );


        status(
            "❌ Daten konnten nicht vollständig gelöscht werden.",
            "error"
        );

    }

}


/* =========================================================
   AUTOMATISCHE SPERRE
========================================================= */

let inactivityTimer =
    null;


function timerZuruecksetzen() {

    if (
        appGesperrt
    ) {

        return;

    }


    clearTimeout(
        inactivityTimer
    );


    inactivityTimer =
        setTimeout(
            sperreAnwendung,
            INACTIVITY_TIMEOUT
        );

}


function sperreAnwendung() {

    if (
        appGesperrt
    ) {

        return;

    }


    appGesperrt =
        true;


    $("#lockScreen")
        .classList.remove(
            "hidden"
        );


    status(
        "🔒 Anwendung wegen Inaktivität gesperrt.",
        "locked"
    );

}


function entsperreAnwendung() {

    appGesperrt =
        false;


    $("#lockScreen")
        .classList.add(
            "hidden"
        );


    status(
        "🔓 Anwendung wieder entsperrt.",
        "ok"
    );


    timerZuruecksetzen();

}


/* =========================================================
   AKTIVITÄT ÜBERWACHEN
========================================================= */

[
    "click",
    "touchstart",
    "keydown",
    "pointerdown"
].forEach(
    eventName => {

        document.addEventListener(
            eventName,
            timerZuruecksetzen,
            {
                passive: true
            }
        );

    }
);


/* =========================================================
   SICHERHEITSCHECK
========================================================= */

function sicherheitsCheck() {

    if (
        !window.isSecureContext
    ) {

        status(
            "⚠️ Keine sichere HTTPS-Verbindung.",
            "warn"
        );

        return false;

    }


    if (
        !window.crypto ||
        !window.crypto.subtle
    ) {

        status(
            "❌ Web Crypto wird nicht unterstützt.",
            "error"
        );

        return false;

    }


    if (
        !window.indexedDB
    ) {

        status(
            "❌ IndexedDB wird nicht unterstützt.",
            "error"
        );

        return false;

    }


    return true;

}


/* =========================================================
   SERVICE WORKER
========================================================= */

function serviceWorkerStarten() {

    if (
        !("serviceWorker" in navigator)
    ) {

        return;

    }


    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./sw.js",
                    {
                        scope: "./"
                    }
                )
                .catch(
                    () => {

                        /*
                         * Keine sensiblen Daten loggen.
                         */

                        status(
                            "⚠️ Offline-Modul konnte nicht aktiviert werden.",
                            "warn"
                        );

                    }
                );

        }
    );

}


/* =========================================================
   BUTTONS
========================================================= */

function buttonsEinrichten() {

    $("#btnNeuePerson")
        .addEventListener(
            "click",
            () => {

                neuesFormular();

                window.scrollTo(
                    {
                        top:
                            document.body.scrollHeight,
                        behavior:
                            "smooth"
                    }
                );

            }
        );


    $("#btnMail")
        .addEventListener(
            "click",
            zeigeZusatzMaske
        );


    $("#btnEmailErstellen")
        .addEventListener(
            "click",
            finaleMailAbschicken
        );


    $("#btnZusatzZurueck")
        .addEventListener(
            "click",
            versteckeZusatzMaske
        );


    $("#btnBackupExport")
        .addEventListener(
            "click",
            backupExportieren
        );


    $("#btnBackupImport")
        .addEventListener(
            "click",
            backupImportStarten
        );


    $("#backupDatei")
        .addEventListener(
            "change",
            backupDateiVerarbeiten
        );


    $("#btnLoeschen")
        .addEventListener(
            "click",
            allesLoeschen
        );


    $("#btnEntsperren")
        .addEventListener(
            "click",
            entsperreAnwendung
        );

}


/* =========================================================
   START
========================================================= */

async function appStarten() {

    if (
        !sicherheitsCheck()
    ) {

        return;

    }


    buttonsEinrichten();

    serviceWorkerStarten();


    try {

        await holeGeraeteSchluessel();

    }
    catch (error) {

        console.error(
            "Sicherer Geräteschlüssel konnte nicht initialisiert werden."
        );


        status(
            "❌ Sicherer Geräteschlüssel konnte nicht initialisiert werden.",
            "error"
        );

        return;

    }


    await datenWiederherstellen();


    timerZuruecksetzen();

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    appStarten
);
