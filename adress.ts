interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

class AddressBook {
  private addresses: Address[];

  constructor() {
    this.addresses = [];
  }

  addAddress(address: Address): void {
    this.addresses.push(address);
  }

  getAddresses(): Address[] {
    return this.addresses;
  }
}

export { Address, AddressBook };
