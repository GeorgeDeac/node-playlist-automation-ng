module.exports = [
    {
        name: "Electricity",
        autostart: true,
        show: {
            slug: 'electricity'
        },
        mpd: {
            config: {
                port: 6110,
                audio_output: {
                    mount: "/electro",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Breaks",
        autostart: true,
        show: {
            slug: 'breaks'
        },
        mpd: {
            config: {
                port: 6120,
                audio_output: {
                    mount: "/breaks",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Jazz",
        autostart: true,
        show: {
            slug: 'jazz'
        },
        mpd: {
            config: {
                port: 6130,
                audio_output: {
                    mount: "/jazz",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Nightwatch",
        autostart: true,
        show: {
            slug: 'nightwatch'
        },
        mpd: {
            config: {
                port: 6140,
                audio_output: {
                    mount: "/nightwatch",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Deep",
        autostart: true,
        show: {
            slug: 'deep'
        },
        mpd: {
            config: {
                port: 6150,
                audio_output: {
                    mount: "/deep",
                    port: 8100
                }
            }
        }
    },
    {
        name: "MNML",
        autostart: true,
        show: {
            slug: 'mnml'
        },
        mpd: {
            config: {
                port: 6160,
                audio_output: {
                    mount: "/mnml",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Cheesy",
        autostart: true,
        show: {
            slug: 'cheesy'
        },
        mpd: {
            config: {
                port: 6170,
                audio_output: {
                    mount: "/cheesy",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Dance",
        autostart: true,
        show: {
            slug: 'dance'
        },
        mpd: {
            config: {
                port: 6180,
                audio_output: {
                    mount: "/dance",
                    port: 8100
                }
            }
        }
    },
    {
        name: "Controversica",
        autostart: true,
        show: {
            slug: 'controversica'
        },
        mpd: {
            config: {
                port: 6190,
                audio_output: {
                    mount: "/contra",
                    port: 8100
                }
            }
        }
    },
    {
        name: "DnB",
        autostart: true,
        show: {
            slug: 'dnb'
        },
        mpd: {
            config: {
                port: 6200,
                audio_output: {
                    mount: "/dnb",
                    port: 8100
                }
            }
        }
    }
];

