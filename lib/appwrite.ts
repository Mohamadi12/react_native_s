import {
  Client,
  Account,
  Databases,
  Avatars,
  OAuthProvider,
} from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

export const config = {
  platform: "com.restate.app",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatar = new Avatars(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/"); // The callback URL to redirect to after login is successful on the web browser

    // Create the OAuth2 token for the Google provider
    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) throw new Error("Failed to login");

    // Open the Google login page in the web browser
    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== "success") throw new Error("Failed to login");

    // Extract the secret and userId from the callback URL
    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret")?.toString();
    const userId = url.searchParams.get("userId")?.toString();

    if (!secret || !userId) throw new Error("Failed to login");

    // Create the session
    const session = await account.createSession(secret, userId);

    if (!session) throw new Error("Failed to login");

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function logout() {
  try {
    // Delete the current session
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getUser() {
  try {
    // Get the current user account details and avatar
    const response = await account.get();

    if (response.$id) {
      // Get the user avatar from the Appwrite SDK
      const userAvatar = avatar.getInitials(response.name);

      // Return the user avatar as a string
      return {
        ...response,
        avatar: userAvatar.toString(),
      };
    }
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
}
