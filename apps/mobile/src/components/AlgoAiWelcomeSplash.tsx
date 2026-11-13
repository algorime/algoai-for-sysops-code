// AlgoAI for SysOps: welcome screen shown over the app on every launch until the user closes it.
import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Modal, Pressable, View } from "react-native";

import { AppText as Text } from "./ui/AppText";

const BUILT_BY_ALGORIME_SOURCE = require("../../../../assets/algorime/built-by-algorime-dark-blue.png");
const ALGORIME_URL = "https://www.algorime.it";
// Background of the Built By Algorime logo, also used for the screen's border and button.
const ALGORIME_DARK_BLUE = "#13294B";

// Module state, so remounting the app shell does not show it again before the next launch.
let closedThisLaunch = false;

export function AlgoAiWelcomeSplash() {
  const [open, setOpen] = useState(!closedThisLaunch);
  const close = () => {
    closedThisLaunch = true;
    setOpen(false);
  };

  return (
    // Only the Close button closes it: the Android back gesture and outside taps are ignored.
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/50 px-5">
        <View
          accessibilityViewIsModal
          className="w-full max-w-xl items-center gap-5 rounded-3xl bg-screen px-6 pt-8 pb-6"
          style={{ borderWidth: 2, borderColor: ALGORIME_DARK_BLUE }}
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Algorime website"
            onPress={() => void Linking.openURL(ALGORIME_URL)}
          >
            <Image
              source={BUILT_BY_ALGORIME_SOURCE}
              accessibilityLabel="Built by Algorime"
              contentFit="contain"
              style={{ width: 240, height: 96 }}
            />
          </Pressable>
          <Text
            role="heading"
            className="text-center text-2xl font-t3-bold tracking-[-0.4px] text-foreground"
          >
            AlgoAI for SysOps and DevOps
          </Text>
          <View className="gap-2">
            <Text className="text-center text-base text-foreground-muted">
              The Algorime® AI environment for SysOps and DevOps activities that will change your
              project and development strategy. Enjoy it!
            </Text>
            <Text className="text-center text-base text-foreground-muted">
              This is part of AlgoAI Privé, an AI platform for inference with distributed LLMs,
              built to keep your data truly private.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            className="mt-1 rounded-full px-8 py-3"
            style={{ backgroundColor: ALGORIME_DARK_BLUE }}
          >
            <Text className="text-base font-t3-bold text-white">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
