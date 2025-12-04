import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Copy, RefreshCw, Key } from "lucide-react";

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPasswords, setGeneratedPasswords] = useState<string[]>([]);

  const generatePassword = () => {
    let charset = "";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      toast.error("Please select at least one character type");
      return "";
    }

    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGenerate = (count: number = 1) => {
    const passwords = [];
    for (let i = 0; i < count; i++) {
      passwords.push(generatePassword());
    }
    setGeneratedPasswords(passwords);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Password copied to clipboard");
  };

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="mb-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 light-ray opacity-20 pointer-events-none" />
        <h1 className="text-6xl font-bold text-gradient-light mb-4 heading">
          PASSWORD GENERATOR
        </h1>
        <p className="text-muted-foreground text-lg">
          Create secure passwords with customizable settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* Settings */}
        <Card className="card-cinematic border-cinematic">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 heading text-2xl">
              <Key className="h-6 w-6 text-primary" />
              SETTINGS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Length */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="heading">LENGTH</Label>
                <span className="text-2xl font-bold text-primary">{length}</span>
              </div>
              <Slider
                value={[length]}
                onValueChange={(value) => setLength(value[0])}
                min={8}
                max={64}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Character Types */}
            <div className="space-y-4">
              <Label className="heading">CHARACTER TYPES</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uppercase"
                  checked={includeUppercase}
                  onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                />
                <label
                  htmlFor="uppercase"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Uppercase (A-Z)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowercase"
                  checked={includeLowercase}
                  onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                />
                <label
                  htmlFor="lowercase"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lowercase (a-z)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="numbers"
                  checked={includeNumbers}
                  onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                />
                <label
                  htmlFor="numbers"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Numbers (0-9)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="symbols"
                  checked={includeSymbols}
                  onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                />
                <label
                  htmlFor="symbols"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Symbols (!@#$%^&*)
                </label>
              </div>
            </div>

            {/* Generate Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => handleGenerate(1)}
                className="w-full glow-golden"
                size="lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Generate Password
              </Button>
              <Button
                onClick={() => handleGenerate(5)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Generate 5 Variations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Passwords */}
        <Card className="card-cinematic border-cinematic">
          <CardHeader>
            <CardTitle className="heading text-2xl">GENERATED PASSWORDS</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPasswords.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click generate to create passwords
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedPasswords.map((password, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-sidebar-accent rounded-md border border-sidebar-border group"
                  >
                    <Input
                      value={password}
                      readOnly
                      className="font-mono text-sm bg-transparent border-0 focus-visible:ring-0"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(password)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
