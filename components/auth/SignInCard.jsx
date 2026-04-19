import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import Link from "next/link";

const SignInCard = ({ handleGoogleLoginSuccess, handleGoogleLoginFailure }) => {
  return (
    <Card className="border-0 shadow-xl bg-gray-50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-balance">
          Добре дошли
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-2">
          Влезте с вашия училищен имейл, за да започнете да поръчвате
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-8">
        <div className="flex items-center justify-center">
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          >
            <div>
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
                theme="outline"
                size="large"
                width="350px"
                logo_alignment="left"
                type="standard"
                text="continue_with"
              />
            </div>
          </GoogleOAuthProvider>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            С вашата регистрация се съгласявате с нашите{" "}
            <Link
              href="/terms-of-service"
              className="p-0 h-auto text-xs text-[#478BAF] hover:underline"
            >
              Terms of Service
            </Link>{" "}
            и{" "}
            <Link
              href="/privacy-policy"
              variant="link"
              className="p-0 h-auto text-xs text-[#478BAF] hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignInCard;

function Logo() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
      <img className="w-12" src="./logo-nobg.png" />
    </div>
  );
}

