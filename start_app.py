import os
import subprocess
import platform

def run_backend():
    print("Запускаем сервер на бэкенде...")
    venv_path = os.path.join("Back", "venv", "Scripts" if platform.system() == "Windows" else "bin", "activate")
    backend_script = os.path.join("Back", "main.py")

    if not os.path.exists(venv_path):
        print(f"Ошибка: виртуальная среда не найдена по пути: {venv_path}")
        return
    if not os.path.exists(backend_script):
        print(f"Ошибка: файл main.py не найден по пути: {backend_script}")
        return

    if platform.system() == "Windows":
        command = f"cmd /c \"{venv_path} && python {backend_script}\""
    else:
        command = f"source {venv_path} && python {backend_script}"

    subprocess.Popen(command, shell=True)
    print("Бэкенд запущен.")

def run_frontend():
    print("Запускаем фронтенд...")
    frontend_path = os.path.join("geodrone")

    if not os.path.exists(frontend_path):
        print(f"Ошибка: папка geodrone не найдена по пути: {frontend_path}")
        return

    os.chdir(frontend_path)

    try:
        # Выполняем npm install
        subprocess.run([r"C:/Program Files/nodejs/npm.cmd", "install"], check=True)
        # Запускаем dev-сервер
        subprocess.Popen([r"C:/Program Files/nodejs/npm.cmd", "run", "dev"], shell=True)
        print("Фронтенд запущен.")
    except FileNotFoundError as e:
        print(f"Ошибка: npm не найден. Убедитесь, что Node.js установлен и npm доступен. {e}")
    except subprocess.SubprocessError as e:
        print(f"Ошибка при запуске фронтенда: {e}")

if __name__ == "__main__":
    try:
        run_backend()
        run_frontend()
    except Exception as e:
        print(f"Общая ошибка: {e}")
