import { Address } from './Address'

export interface Name {
  name: string
  firstName: string
  lastName: string
}

export interface CitizenType extends Name {
  id: any
  position: any
  workplace: Workplace
  home: Home
}

export interface Workplace extends Address {}
export interface Home extends Address {}
