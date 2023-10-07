import { decodeEntry } from '@holochain-open-dev/utils';
import {
  AgentPubKey,
  Record,
  AppAgentClient,
  AppAgentCallZomeRequest,
  CellId,
  encodeHashToBase64,
} from '@holochain/client';
import { UnsubscribeFunction } from 'emittery';
import { Profile, ProfilesSignal } from './types';

export interface ProfilesEvents {
  ['signal']: ProfilesSignal;
}

export class ProfilesClient {
  constructor(
    public client: AppAgentClient,
    public cellId: CellId,
    public zomeName = 'profiles',
  ) {}

  on<Name extends keyof ProfilesEvents>(
    eventName: Name | readonly Name[],
    listener: (eventData: ProfilesEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFunction {
    return this.client.on(eventName, async signal => {
      if (
        encodeHashToBase64(signal.cell_id[0]) ===
          encodeHashToBase64(this.cellId[0]) &&
        encodeHashToBase64(signal.cell_id[1]) ===
          encodeHashToBase64(this.cellId[1]) &&
        // signal.cell_id.map((hash) => encodeHashToBase64(hash)) == this.cellId.map((hash) => encodeHashToBase64(hash))) &&
        this.zomeName === signal.zome_name
      ) {
        listener(signal.payload as ProfilesSignal);
      }
    });
  }

  /**
   * Get the profile for the given agent, if they have created it
   *
   * @param agentPubKey the agent to get the profile for
   * @returns the profile of the agent, if they have created one
   */
  async getAgentProfile(
    agentPubKey: AgentPubKey,
  ): Promise<Profile | undefined> {
    const record: Record | undefined = await this.callZome(
      'get_agent_profile',
      agentPubKey,
    );

    return record ? decodeEntry(record) : undefined;
  }

  /**
   * Search profiles that start with nicknameFilter
   *
   * @param nicknameFilter must be of at least 3 characters
   * @returns the agents with the nickname starting with nicknameFilter
   */
  async searchAgents(nicknameFilter: string): Promise<AgentPubKey[]> {
    return this.callZome('search_agents', nicknameFilter);
  }

  /**
   * Get all the agents in the DHT that have created a profile
   *
   * @returns the agent public keys of all agents that have created a profile
   */
  async getAgentsWithProfile(): Promise<AgentPubKey[]> {
    return this.callZome('get_agents_with_profile', null);
  }

  /**
   * Create my profile
   *
   * @param profile the profile to create
   */
  async createProfile(profile: Profile): Promise<void> {
    return this.callZome('create_profile', profile);
  }

  /**
   * Update my profile
   *
   * @param profile the profile to create
   */
  async updateProfile(profile: Profile): Promise<void> {
    return this.callZome('update_profile', profile);
  }

  private callZome(fn_name: string, payload: any) {
    const req: AppAgentCallZomeRequest = {
      cell_id: this.cellId,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
