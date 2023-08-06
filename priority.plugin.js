/**
 * @name YureiTutorials
 * @version 0.0.3
 * @description Just a plugin that try to add priority to ur voice using opcode 5 speaking payloads.
 * @source https://github.com/edoderg/YureiTutorials
 * @updateUrl https://github.com/edoderg/YureiTutorials
 */

module.exports = (() => {
  const config = {
    info: {
      name: "YureiTutorials",
      authors: [
        {
              name: "YureiTutorials",
          discord_id: "1",
        },
      ],
      version: "0.0.4",
          description: "Just a plugin that try to add priority to ur voice",
    },
    changelog: [
      {
        title: "Changelog",
        items: [
          "BetterDiscord Stereo Sound for 1.9.3",
          "Language changed",
          "Added Priority Speaking",
        ],
      },
    ],
    defaultConfig: [
      {
        type: "switch",
        id: "enableToasts",
        name: "Enable notifications",
        note: "Warning for Discord Audio Features",
        value: true,
      },
      {
        type: "switch",
        id: "enablePriority",
        name: "Enable Priority Speaking",
        note: "Send voice with priority",
        value: false,
      },
    ],
  };

  return !global.ZeresPluginLibrary
    ? class {
        constructor() {
          this._config = config;
        }
        getName() {
          return config.info.name;
        }
        getAuthor() {
          return config.info.authors.map((a) => a.name).join(", ");
        }
        getDescription() {
          return config.info.description;
        }
        getVersion() {
          return config.info.version;
        }
        load() {
          BdApi.showConfirmationModal(
            "BetterDiscord Library Missing",
            `ZeresPluginLibrary is missing. Click "Install Now" to download it.`,
            {
              confirmText: "Install Now",
              cancelText: "Cancel",
              onConfirm: () => {
                require("request").get(
                  "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
                  async (error, response, body) => {
                    if (error)
                      return require("electron").shell.openExternal(
                        "https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js"
                      );
                    await new Promise((r) =>
                      require("fs").writeFile(
                        require("path").join(
                          BdApi.Plugins.folder,
                          "0PluginLibrary.plugin.js"
                        ),
                        body,
                        r
                      )
                    );
                  }
                );
              },
            }
          );
        }
        start() {}
        stop() {}
      }
    : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
          const { DiscordModules, Patcher, Toasts } = Library;
          const { UserSettingsStore } = DiscordModules;

          return class edoStereo extends Plugin {
            constructor() {
              super();
              this._config = config;
            }

            onStart() {
              this.settingsWarning();
              Patcher.after(
                "edoStereo",
                UserSettingsStore,
                "updateRemoteSettings",
                (_, [, settings]) => {
                  if (settings?.voice?.send != null) {
                    settings.voice.send = this.settings.enablePriority;
                  }
                }
              );
            }

            onStop() {
              Patcher.unpatchAll();
            }

            getSettingsPanel() {
              const panel = this.buildSettingsPanel();
              panel.addListener(() => this.settingsWarning());
              panel.addSwitch(
                "enableToasts",
                "Enable notifications",
                "Warning for Discord Audio Features",
                this.settings.enableToasts,
                (val) => {
                  this.settings.enableToasts = val;
                  this.saveSettings();
                }
              );
              panel.addSwitch(
                "enablePriority",
                "Enable Priority Speaking",
                "Send voice with priority",
                this.settings.enablePriority,
                (val) => {
                  this.settings.enablePriority = val;
                  this.saveSettings();
                  if (val) {
                    this.startSpeaking();
                  } else {
                    this.stopSpeaking();
                  }
                }
              );
              return panel.getElement();
            }

            startSpeaking() {
              const speakingPayload = {
                op: 5,
                d: {
                  speaking: 5,
                  delay: 0,
                  ssrc: 1,
                },
              };
              BdApi.findModuleByProps("sendGatewayPayload").sendGatewayPayload(
                speakingPayload
              );
            }

            stopSpeaking() {
              const speakingPayload = {
                op: 5,
                d: {
                  speaking: 0,
                  delay: 0,
                  ssrc: 1,
                },
              };
              BdApi.findModuleByProps("sendGatewayPayload").sendGatewayPayload(
                speakingPayload
              );
            }

            settingsWarning() {
              const voiceSettingsStore = BdApi.findModuleByProps(
                "getEchoCancellation"
              );
              if (
                voiceSettingsStore.getNoiseSuppression() ||
                voiceSettingsStore.getNoiseCancellation() ||
                voiceSettingsStore.getEchoCancellation()
              ) {
                if (this.settings.enableToasts) {
                  Toasts.show(
                    "Please disable echo cancellation, noise reduction, and noise suppression for edoStereo",
                    { type: "warning", timeout: 5000 }
                  );
                }
                return true;
              } else return false;
            }
          };
        };
        return plugin(Plugin, Api);
      })(global.ZeresPluginLibrary.buildPlugin(config));
})();




/*@end@*/
