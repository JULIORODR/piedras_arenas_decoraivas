from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import unittest
import time

class TestRegistro(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get('http://localhost:8080/index.html')
        self.driver.maximize_window()

    def test_registro_exitoso(self):
        # Localizar elementos del formulario
        nombre = self.driver.find_element(By.ID, 'nombre')
        usuario = self.driver.find_element(By.ID, 'usuario')
        correo = self.driver.find_element(By.ID, 'correo')
        contrasena = self.driver.find_element(By.ID, 'contrasena')
        repetir = self.driver.find_element(By.ID, 'repetir')
        boton = self.driver.find_element(By.TAG_NAME, 'button')

        # Ingresar datos válidos
        nombre.send_keys('Usuario Prueba')
        usuario.send_keys('usuario_test')
        correo.send_keys('test@example.com')
        contrasena.send_keys('123456')
        repetir.send_keys('123456')

        # Enviar formulario
        boton.click()

        # Esperar mensaje de éxito
        time.sleep(2)
        self.assertIn('¡Usuario registrado con éxito!', self.driver.switch_to.alert.text)
        self.driver.switch_to.alert.accept()

    def test_contrasenas_no_coinciden(self):
        # Localizar elementos del formulario
        nombre = self.driver.find_element(By.ID, 'nombre')
        usuario = self.driver.find_element(By.ID, 'usuario')
        correo = self.driver.find_element(By.ID, 'correo')
        contrasena = self.driver.find_element(By.ID, 'contrasena')
        repetir = self.driver.find_element(By.ID, 'repetir')
        boton = self.driver.find_element(By.TAG_NAME, 'button')

        # Ingresar datos con contraseñas diferentes
        nombre.send_keys('Usuario Prueba')
        usuario.send_keys('usuario_test')
        correo.send_keys('test@example.com')
        contrasena.send_keys('123456')
        repetir.send_keys('654321')

        # Enviar formulario
        boton.click()

        # Verificar mensaje de error
        mensaje_error = self.driver.find_element(By.ID, 'mensajeError')
        self.assertEqual(mensaje_error.text, 'Las contraseñas no coinciden.')

    def test_contrasena_corta(self):
        # Localizar elementos del formulario
        nombre = self.driver.find_element(By.ID, 'nombre')
        usuario = self.driver.find_element(By.ID, 'usuario')
        correo = self.driver.find_element(By.ID, 'correo')
        contrasena = self.driver.find_element(By.ID, 'contrasena')
        repetir = self.driver.find_element(By.ID, 'repetir')
        boton = self.driver.find_element(By.TAG_NAME, 'button')

        # Ingresar datos con contraseña corta
        nombre.send_keys('Usuario Prueba')
        usuario.send_keys('usuario_test')
        correo.send_keys('test@example.com')
        contrasena.send_keys('123')
        repetir.send_keys('123')

        # Enviar formulario
        boton.click()

        # Verificar mensaje de error
        mensaje_error = self.driver.find_element(By.ID, 'mensajeError')
        self.assertEqual(mensaje_error.text, 'La contraseña debe tener al menos 6 caracteres.')

    def test_campos_vacios(self):
        # Enviar formulario sin datos
        boton = self.driver.find_element(By.TAG_NAME, 'button')
        boton.click()

        # Verificar mensaje de error
        mensaje_error = self.driver.find_element(By.ID, 'mensajeError')
        self.assertEqual(mensaje_error.text, 'Todos los campos son obligatorios.')

    def tearDown(self):
        self.driver.quit()

if __name__ == '__main__':
    unittest.main()