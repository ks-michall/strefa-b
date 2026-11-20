import { students } from "./students"

/** Active class members, including the class teacher. */
export function isActiveStudent(name: string): boolean {
  return students.some(student => student === name)
}
