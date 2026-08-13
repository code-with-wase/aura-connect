import { Contacts, type Permission } from "@capacitor/contacts";
import { normalizePhoneNumber } from "@/lib/phone-utils";

export interface DeviceContact {
  id?: string;
  name: string;
  phoneNumbers: Array<{
    number: string;
    normalized: string | null;
  }>;
}

export type PermissionStatus = "granted" | "denied" | "restricted" | "prompt";

/**
 * Device contacts service using Capacitor Contacts plugin
 * Handles native contact access on Android and iOS with proper permission handling
 */
export const deviceContactsService = {
  /**
   * Check if the app is running on a native platform (Android or iOS)
   */
  isNativePlatform(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window as any).Capacitor?.isPluginAvailable?.("Contacts");
  },

  /**
   * Request contacts permission from the user
   * Returns the permission status after requesting
   */
  async requestPermission(): Promise<PermissionStatus> {
    if (!this.isNativePlatform()) {
      return "granted"; // Web doesn't need permission
    }

    try {
      const result = await Contacts.requestPermissions();
      const status = (result?.contacts as Permission) ?? "prompt";
      return status as PermissionStatus;
    } catch (error) {
      console.error("Error requesting contacts permission:", error);
      return "denied";
    }
  },

  /**
   * Check current contacts permission status without requesting
   */
  async checkPermission(): Promise<PermissionStatus> {
    if (!this.isNativePlatform()) {
      return "granted";
    }

    try {
      const result = await Contacts.checkPermissions();
      const status = (result?.contacts as Permission) ?? "prompt";
      return status as PermissionStatus;
    } catch (error) {
      console.error("Error checking contacts permission:", error);
      return "denied";
    }
  },

  /**
   * Get all device contacts with normalized phone numbers
   * Returns an array of DeviceContact objects
   */
  async getContacts(): Promise<DeviceContact[]> {
    if (!this.isNativePlatform()) {
      // Fallback for web - return empty array
      return [];
    }

    try {
      const result = await Contacts.getContacts();
      const allContacts = result.contacts || [];

      // Filter and normalize contacts
      return allContacts
        .map((contact) => {
          const phones = contact.phones || [];
          const phoneNumbers = phones
            .map((p) => ({
              number: p.number || "",
              normalized: normalizePhoneNumber(p.number),
            }))
            .filter((p) => p.normalized); // Only keep contacts with valid phone numbers

          return {
            id: contact.contactId,
            name: contact.name?.formatted || `${contact.name?.given || ""} ${contact.name?.family || ""}`.trim(),
            phoneNumbers,
          };
        })
        .filter((contact) => contact.phoneNumbers.length > 0 && contact.name); // Only keep contacts with name and phone
    } catch (error) {
      console.error("Error getting contacts:", error);
      return [];
    }
  },

  /**
   * Extract unique normalized phone numbers from device contacts
   * Removes duplicates
   */
  async getUniquePhoneNumbers(): Promise<string[]> {
    const contacts = await this.getContacts();
    const phoneSet = new Set<string>();

    contacts.forEach((contact) => {
      contact.phoneNumbers.forEach((phone) => {
        if (phone.normalized) {
          phoneSet.add(phone.normalized);
        }
      });
    });

    return Array.from(phoneSet);
  },
};
