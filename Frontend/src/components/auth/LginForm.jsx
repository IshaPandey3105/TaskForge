import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import useAuthStore from "../../store/authStore";

export default function LoginForm({ onRegisterClick }) {
  const { login, error, clearError, isLoading } = useAuthStore();
  const [loginError, setLoginError] = useState(null);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const handleSubmit = async (values) => {
    clearError();
    setLoginError(null);

    try {
      await login(values);
    } catch (error) {
      setLoginError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <Box mx="auto" sx={{ maxWidth: 400 }} p="md">
      <Text size="xl" weight={700} mb="md">
        Welcome back to Project Camp
      </Text>

      {(loginError || error) && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Authentication Error"
          color="red"
          mb="md"
        >
          {loginError || error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Email"
            placeholder="your@email.com"
            {...form.getInputProps("email")}
          />

          <PasswordInput
            required
            label="Password"
            placeholder="Your password"
            {...form.getInputProps("password")}
          />

          <Button type="submit" loading={isLoading}>
            Sign in
          </Button>

          <Group position="apart" mt="xs">
            <Anchor
              component="button"
              type="button"
              color="dimmed"
              onClick={() => {}}
              size="xs"
            >
              Forgot password?
            </Anchor>

            <Anchor
              component="button"
              type="button"
              color="dimmed"
              size="xs"
              onClick={onRegisterClick}
            >
              Don't have an account? Register
            </Anchor>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
