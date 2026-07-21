import { defineConfig } from "@theweave/cli";

export default defineConfig({
  toolCurations: [],
  groups: [
    {
      name: "Tennis Club",
      networkSeed: "098rc1m-09384u-crm-29384u-cmkj",
      icon: {
        type: "filesystem",
        path: "./workdir/tennis_club.png",
      },
      creatingAgent: {
        agentIdx: 1,
        agentProfile: {
          nickname: "Gaston",
          avatar: {
            type: "filesystem",
            path: "./workdir/gaston.jpeg",
          },
        },
      },
      joiningAgents: [
        {
          agentIdx: 2,
          agentProfile: {
            nickname: "Marsupilami",
            avatar: {
              type: "filesystem",
              path: "./workdir/marsupilami.jpeg",
            },
          },
        },
        {
          agentIdx: 3,
          agentProfile: {
            nickname: "Marsupilami Nr. 2",
            avatar: {
              type: "filesystem",
              path: "./workdir/marsupilami.jpeg",
            },
          },
        },
      ],
      applets: [
        {
          name: "Word Condenser",
          instanceName: "Word Condenser",
          registeringAgent: 1,
          joiningAgents: [2],
        },
      ],
    },
  ],
  applets: [
    {
      name: "Word Condenser",
      subtitle: "Finding new language together.",
      description: "Create words.",
      icon: {
        type: "filesystem",
        path: "./ui/icon.png",
      },
      source: {
        type: "localhost",
        happPath: "./workdir/word-condenser.happ",
        uiPort: 8888,
      },
    },
    // {
    //   name: "Word Condenser webhapp",
    //   subtitle: "Finding new language together.",
    //   description: "Create words.",
    //   icon: {
    //     type: "filesystem",
    //     path: "./ui/icon.png",
    //   },
    //   source: {
    //     type: "filesystem",
    //     path: "./workdir/word-condenser.webhapp",
    //   },
    // },
  ],
});
