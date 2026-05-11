using MySql.Data.MySqlClient;


namespace InsutriasAP.Database
{
    public class DatabaseConnection
    {
        private string connectionString =   
        "server=localhost;port=3307;database=sistema_carpinteria;user=root;password=;";

        public MySqlConnection GetConnection()
        {
            return new MySqlConnection(connectionString);
        }
    }
}