import type {
  CreateBotRegistryArgs,
  CreateBotArgs,
  BotInstance,
  BotRegistry,
  RegisteredBot,
  TelegramSender,
} from "../types/bot.types";
import { createAccessControl } from "./accessControl";
import { createBot } from "./createBot";
import { createSender } from "./sender";

const createBotRegistry = ({
  allowedPeerList = [],
  onLog,
}: CreateBotRegistryArgs = {}): BotRegistry => {
  const registeredBotByName = new Map<string, RegisteredBot>();
  const accessControl = createAccessControl({ allowedPeerList });

  const register = (args: CreateBotArgs): BotInstance => {
    const instance = createBot(args);
    const sender = createSender({
      getBot: () => instance.bot,
      accessControl,
      onLog,
    });

    registeredBotByName.set(args.botName, { instance, sender });

    return instance;
  };

  const get = (botName: string): RegisteredBot | undefined =>
    registeredBotByName.get(botName);

  const getBot = (botName: string) => {
    const registered = registeredBotByName.get(botName);

    return registered?.instance.bot;
  };

  const createSenderForBot = (botName: string): TelegramSender | undefined => {
    const registered = registeredBotByName.get(botName);

    return registered?.sender;
  };

  const launchAll = async (): Promise<void> => {
    const launchPromiseList = Array.from(registeredBotByName.values()).map(
      ({ instance }) => instance.launch(),
    );

    await Promise.all(launchPromiseList);
  };

  const stopAll = async (reason?: string): Promise<void> => {
    const stopPromiseList = Array.from(registeredBotByName.values()).map(
      ({ instance }) => instance.stop(reason),
    );

    await Promise.all(stopPromiseList);
  };

  return {
    register,
    get,
    getBot,
    createSender: createSenderForBot,
    accessControl,
    launchAll,
    stopAll,
  };
};

export { createBotRegistry };
