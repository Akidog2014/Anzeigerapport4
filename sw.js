"use strict";

/*
 * =========================================================
 * PERSONENERFASSUNG V12.1
 * SERVICE WORKER
 * =========================================================
 *
 * Der Service Worker speichert KEINE Personendaten.
 *
 * Er cached ausschließlich die technischen Dateien
 * der PWA.
 *
 * Personendaten werden weiterhin ausschließlich
 * verschlüsselt in IndexedDB gespeichert.
 *
 * =========================================================
 */


/* =========================================================
   CACHE-VERSION
========================================================= */

const CACHE_NAME =
    "personenerfassung-v12-1";


/*
 * Nur diese Dateien werden beim Installieren
 * vorgeladen.
 */

const APP_FILES = [

    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache => {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

        );

        /*
         * Neue Version sofort zur Aktivierung
         * freigeben.
         */

        self.skipWaiting();

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    cacheNames => {

                        return Promise.all(

                            cacheNames.map(
                                cacheName => {

                                    /*
                                     * Alte Versionen löschen.
                                     *
                                     * Wichtig:
                                     * IndexedDB wird hiervon NICHT
                                     * betroffen.
                                     */

                                    if (
                                        cacheName !==
                                        CACHE_NAME
                                    ) {

                                        return caches.delete(
                                            cacheName
                                        );

                                    }

                                    return undefined;

                                }
                            )

                        );

                    }
                )

        );

        /*
         * Neue Service-Worker-Version übernimmt
         * sofort die bereits geöffneten Seiten.
         */

        self.clients.claim();

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        /*
         * Nur GET-Anfragen behandeln.
         */

        if (
            event.request.method !== "GET"
        ) {

            return;

        }


        const url =
            new URL(
                event.request.url
            );


        /*
         * Nur HTTP und HTTPS behandeln.
         */

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return;

        }


        /*
         * Keine fremden Domains cachen.
         *
         * Dadurch werden beispielsweise externe
         * Webseiten oder fremde Ressourcen nicht
         * in den App-Cache aufgenommen.
         */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;

        }


        /*
         * CACHE FIRST
         *
         * Die Anwendung funktioniert dadurch
         * auch offline.
         */

        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(
                    cachedResponse => {

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;

                        }


                        /*
                         * Nicht vorhandene Ressource
                         * aus dem Netzwerk laden.
                         */

                        return fetch(
                            event.request
                        )
                        .then(
                            networkResponse => {

                                /*
                                 * Nur erfolgreiche Antworten
                                 * in den Cache aufnehmen.
                                 */

                                if (
                                    networkResponse &&
                                    networkResponse.ok &&
                                    networkResponse.type ===
                                        "basic"
                                ) {

                                    const copy =
                                        networkResponse.clone();


                                    caches
                                        .open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            cache => {

                                                cache.put(
                                                    event.request,
                                                    copy
                                                );

                                            }
                                        );

                                }


                                return networkResponse;

                            }
                        )
                        .catch(
                            () => {

                                /*
                                 * Wenn keine Netzwerkverbindung
                                 * besteht und die Ressource nicht
                                 * im Cache liegt.
                                 */

                                return new Response(

                                    "Offline – diese Ressource " +
                                    "ist nicht verfügbar.",

                                    {
                                        status: 503,

                                        headers: {

                                            "Content-Type":
                                                "text/plain; " +
                                                "charset=utf-8"

                                        }

                                    }

                                );

                            }
                        );

                    }
                )

        );

    }
);
