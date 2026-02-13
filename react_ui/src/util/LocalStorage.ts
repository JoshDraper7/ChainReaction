import { type User } from "../types/user";

const LOCAL_STORAGE_USER = 'user';

export const getUserFromLocalStorage = (): User | null => {
    const local_user_str = localStorage.getItem(LOCAL_STORAGE_USER)
    if (!local_user_str) return null
    const local_user: User = JSON.parse(local_user_str)
    return local_user
}

export const setUserInLocalStorage = (user: User) => {
    localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user)) 
}