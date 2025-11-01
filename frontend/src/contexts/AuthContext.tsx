import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { apiClient } from "../services/api";
import { User, LoginCredentials, RegisterData, UpdateProfileData, ChangePasswordData } from "../types/auth";

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

type AuthAction =
    | { type: "AUTH_START" }
    | { type: "AUTH_SUCCESS"; payload: { user: User } }
    | { type: "AUTH_FAILURE"; payload: { error: string } }
    | { type: "AUTH_LOGOUT" }
    | { type: "CLEAR_ERROR" }
    | { type: "UPDATE_USER"; payload: { user: User } };

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<boolean>;
    register: (registerData: RegisterData) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (profileData: UpdateProfileData) => Promise<boolean>;
    changePassword: (passwordData: ChangePasswordData) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    clearError: () => void;
    checkAuthStatus: () => Promise<void>;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case "AUTH_START":
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case "AUTH_SUCCESS":
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                isLoading: false,
                error: null,
            };
        case "AUTH_FAILURE":
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: action.payload.error,
            };
        case "AUTH_LOGOUT":
            return {
                ...initialState,
            };
        case "CLEAR_ERROR":
            return {
                ...state,
                error: null,
            };
        case "UPDATE_USER":
            return {
                ...state,
                user: action.payload.user,
            };
        default:
            return state;
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Check authentication status on app start
    const checkAuthStatus = async () => {
        try {
            dispatch({ type: "AUTH_START" });

            const isAuth = await apiClient.isAuthenticated();
            if (isAuth) {
                const response = await apiClient.getProfile();
                if (response.success && response.data) {
                    dispatch({
                        type: "AUTH_SUCCESS",
                        payload: { user: response.data.user },
                    });
                } else {
                    // Token exists but invalid, logout
                    await apiClient.logout();
                    dispatch({ type: "AUTH_LOGOUT" });
                }
            } else {
                dispatch({ type: "AUTH_LOGOUT" });
            }
        } catch (error) {
            console.error("Auth check error:", error);
            dispatch({ type: "AUTH_LOGOUT" });
        }
    };

    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            dispatch({ type: "AUTH_START" });

            const response = await apiClient.login(credentials);

            if (response.success && response.data) {
                dispatch({
                    type: "AUTH_SUCCESS",
                    payload: { user: response.data.user },
                });
                return true;
            } else {
                dispatch({
                    type: "AUTH_FAILURE",
                    payload: { error: response.message || "Đăng nhập thất bại" },
                });
                return false;
            }
        } catch (error) {
            dispatch({
                type: "AUTH_FAILURE",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
            return false;
        }
    };

    const register = async (registerData: RegisterData): Promise<boolean> => {
        try {
            dispatch({ type: "AUTH_START" });

            const response = await apiClient.register(registerData);

            if (response.success && response.data) {
                dispatch({
                    type: "AUTH_SUCCESS",
                    payload: { user: response.data.user },
                });
                return true;
            } else {
                dispatch({
                    type: "AUTH_FAILURE",
                    payload: { error: response.message || "Đăng ký thất bại" },
                });
                return false;
            }
        } catch (error) {
            dispatch({
                type: "AUTH_FAILURE",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
            return false;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await apiClient.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            dispatch({ type: "AUTH_LOGOUT" });
        }
    };

    const updateProfile = async (profileData: UpdateProfileData): Promise<boolean> => {
        try {
            dispatch({ type: "AUTH_START" });

            const response = await apiClient.updateProfile(profileData);

            if (response.success && response.data) {
                dispatch({
                    type: "UPDATE_USER",
                    payload: { user: response.data.user },
                });
                dispatch({ type: "CLEAR_ERROR" });
                return true;
            } else {
                dispatch({
                    type: "AUTH_FAILURE",
                    payload: { error: response.message || "Cập nhật profile thất bại" },
                });
                return false;
            }
        } catch (error) {
            dispatch({
                type: "AUTH_FAILURE",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
            return false;
        }
    };

    const changePassword = async (passwordData: ChangePasswordData): Promise<boolean> => {
        try {
            dispatch({ type: "AUTH_START" });

            const response = await apiClient.changePassword(passwordData);

            if (response.success) {
                dispatch({ type: "CLEAR_ERROR" });
                return true;
            } else {
                dispatch({
                    type: "AUTH_FAILURE",
                    payload: { error: response.message || "Đổi mật khẩu thất bại" },
                });
                return false;
            }
        } catch (error) {
            dispatch({
                type: "AUTH_FAILURE",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
            return false;
        }
    };

    const forgotPassword = async (email: string): Promise<boolean> => {
        try {
            dispatch({ type: "AUTH_START" });

            const response = await apiClient.forgotPassword({ email });

            if (response.success) {
                dispatch({ type: "CLEAR_ERROR" });
                return true;
            } else {
                dispatch({
                    type: "AUTH_FAILURE",
                    payload: { error: response.message || "Gửi email thất bại" },
                });
                return false;
            }
        } catch (error) {
            dispatch({
                type: "AUTH_FAILURE",
                payload: { error: "Lỗi kết nối. Vui lòng thử lại." },
            });
            return false;
        }
    };

    const clearError = () => {
        dispatch({ type: "CLEAR_ERROR" });
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const contextValue: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        clearError,
        checkAuthStatus,
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
