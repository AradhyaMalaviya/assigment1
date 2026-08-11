export interface LoginForm {
  email: string;
  password: string;
}
export interface RegisterForm extends LoginForm {
  name: string;
}
export interface SmtpConfigForm {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
}
